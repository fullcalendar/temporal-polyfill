import { describe, expect, it } from 'vitest'
import { Temporal } from '../classApi/full/implementation'

// Expected values come from native Temporal in V8, which uses ICU4X.

function newYear(calendar: string, year: number): string {
  return Temporal.PlainDate.from({ calendar, year, monthCode: 'M01', day: 1 })
    .withCalendar('iso8601')
    .toString()
}

function describeYear(calendar: string, year: number): string {
  const first = Temporal.PlainDate.from({ calendar, year, month: 1, day: 1 })
  const months: string[] = []
  for (let i = 0; i < first.monthsInYear; i++) {
    const date = first.add({ months: i })
    months.push(`${date.monthCode}=${date.daysInMonth}`)
  }
  return months.join(',')
}

describe('Chinese and Dangi calendars', () => {
  it('starts each year on the ICU4X date', () => {
    const cases: [number, string, string][] = [
      // Before the Qing table: the mean rule at the Beijing offset
      [1880, '1880-02-11', '1880-02-11'],
      [1899, '1899-02-10', '1899-02-10'],
      // Qing table
      [1900, '1900-01-31', '1900-01-31'],
      [1911, '1911-01-30', '1911-01-30'],
      // Modern tables
      [1912, '1912-02-18', '1912-02-18'],
      [1954, '1954-02-03', '1954-02-04'],
      [2027, '2027-02-06', '2027-02-07'],
      [2030, '2030-02-03', '2030-02-03'],
      [2102, '2102-02-17', '2102-02-17'],
      // After the tables: the mean rule at UTC+8 and UTC+9
      [2103, '2103-02-07', '2103-02-07'],
      [2200, '2200-02-15', '2200-02-15'],
    ]
    for (const [year, chinese, dangi] of cases) {
      expect(newYear('chinese', year), `chinese ${year}`).toBe(chinese)
      expect(newYear('dangi', year), `dangi ${year}`).toBe(dangi)
    }
  })

  it('places leap months and month lengths per calendar', () => {
    expect(describeYear('chinese', 2023)).toBe(
      'M01=29,M02=30,M02L=29,M03=29,M04=30,M05=30,M06=29,M07=30,M08=30,M09=29,M10=30,M11=29,M12=30',
    )
    expect(describeYear('dangi', 2023)).toBe(
      'M01=29,M02=30,M02L=29,M03=30,M04=29,M05=30,M06=29,M07=30,M08=30,M09=29,M10=30,M11=29,M12=30',
    )
    expect(describeYear('chinese', 2033)).toBe(
      'M01=29,M02=30,M03=29,M04=29,M05=30,M06=29,M07=30,M08=29,M09=30,M10=30,M11=30,M11L=29,M12=30',
    )

    const leapMonth = (calendar: string, year: number) =>
      describeYear(calendar, year).match(/M\d\dL/)![0]
    expect(leapMonth('chinese', 2012)).toBe('M04L')
    expect(leapMonth('dangi', 2012)).toBe('M03L')
    expect(leapMonth('chinese', 2099)).toBe('M02L')
    expect(leapMonth('dangi', 2099)).toBe('M03L')
  })

  it('reads each day back from ISO', () => {
    const cases: [string, string, number, string, number][] = [
      ['chinese', '2027-02-06', 2027, 'M01', 1],
      ['dangi', '2027-02-06', 2026, 'M12', 30],
      ['chinese', '2023-04-20', 2023, 'M03', 1],
      ['chinese', '2023-03-22', 2023, 'M02L', 1],
    ]
    for (const [calendar, isoDate, year, monthCode, day] of cases) {
      const date = Temporal.PlainDate.from(isoDate).withCalendar(calendar)
      expect(
        [date.year, date.monthCode, date.day],
        `${calendar} ${isoDate}`,
      ).toEqual([year, monthCode, day])
    }
  })

  it('picks the ICU4X reference year for a month-day', () => {
    const cases: [string, number, string, string | undefined][] = [
      ['M01', 30, '1970-03-07', '1970-03-07'],
      ['M02L', 30, '1972-04-13', undefined],
      ['M05L', 29, '1971-07-21', '1971-07-21'],
      ['M05L', 30, '1952-07-21', '1952-07-21'],
      ['M09L', 30, '1972-11-05', undefined],
      ['M11L', 29, '2034-01-19', '2034-01-19'],
      ['M12L', 1, '1972-01-16', undefined],
      ['M12', 30, '1972-02-14', '1972-02-14'],
    ]
    for (const calendar of ['chinese', 'dangi']) {
      for (const [monthCode, day, constrained, rejected] of cases) {
        const fields = { calendar, monthCode, day }
        const label = `${calendar} ${monthCode}-${day}`
        expect(Temporal.PlainMonthDay.from(fields).toString(), label).toBe(
          `${constrained}[u-ca=${calendar}]`,
        )
        if (rejected) {
          expect(
            Temporal.PlainMonthDay.from(fields, {
              overflow: 'reject',
            }).toString(),
            label,
          ).toBe(`${rejected}[u-ca=${calendar}]`)
        } else {
          expect(
            () => Temporal.PlainMonthDay.from(fields, { overflow: 'reject' }),
            label,
          ).toThrow(RangeError)
        }
      }
      for (const monthCode of ['M13', 'M13L', 'M15']) {
        expect(
          () => Temporal.PlainMonthDay.from({ calendar, monthCode, day: 1 }),
          `${calendar} ${monthCode}`,
        ).toThrow(RangeError)
      }
    }
  })

  // The start is in a leap month that the end year lacks, and the end is in
  // the month after it. The leap month comes before that month, so a full
  // year has passed.
  it('counts a full year from a leap month the end year lacks', () => {
    const cases: [string, string, string, string][] = [
      ['2001-06-20', '2002-06-11', 'P1Y2D', 'P1Y1D'], // M04L-29 to M05-1
      ['2006-09-21', '2007-09-11', 'P1Y1D', 'P1Y1D'], // M07L-29 to M08-1
      ['2240-05-21', '2388-05-25', 'P148Y20D', 'P148Y19D'], // M03L-29 to M04-19
      ['2224-01-21', '2372-01-21', 'P148Y15D', 'P148Y15D'], // M11L-30 to M12-15
    ]
    for (const [start, end, until, since] of cases) {
      const startDate = Temporal.PlainDate.from(start).withCalendar('chinese')
      const endDate = Temporal.PlainDate.from(end).withCalendar('chinese')
      expect(
        startDate.until(endDate, { largestUnit: 'years' }).toString(),
        `${start} until ${end}`,
      ).toBe(until)
      expect(
        endDate.since(startDate, { largestUnit: 'years' }).toString(),
        `${end} since ${start}`,
      ).toBe(since)
    }
  })
})
