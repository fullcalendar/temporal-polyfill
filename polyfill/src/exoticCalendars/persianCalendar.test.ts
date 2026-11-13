import { describe, expect, it } from 'vitest'
import { Temporal } from '../classApi/full/implementation'

// NON_LEAP_CORRECTION from ICU4X, listed in full so the compact runs in
// persianCalendar.ts are checked against the source they come from.
// https://github.com/unicode-org/icu4x/blob/main/utils/calendrical_calculations/src/persian.rs
const icu4xNonLeapCorrections = [
  1502, 1601, 1634, 1667, 1700, 1733, 1766, 1799, 1832, 1865, 1898, 1931, 1964,
  1997, 2030, 2059, 2063, 2096, 2129, 2158, 2162, 2191, 2195, 2224, 2228, 2257,
  2261, 2290, 2294, 2323, 2327, 2356, 2360, 2389, 2393, 2422, 2426, 2455, 2459,
  2488, 2492, 2521, 2525, 2554, 2558, 2587, 2591, 2620, 2624, 2653, 2657, 2686,
  2690, 2719, 2723, 2748, 2752, 2756, 2781, 2785, 2789, 2818, 2822, 2847, 2851,
  2855, 2880, 2884, 2888, 2913, 2917, 2921, 2946, 2950, 2954, 2979, 2983, 2987,
]

function isLeapYear(year: number): boolean {
  if (icu4xNonLeapCorrections.includes(year)) {
    return false
  }
  if (icu4xNonLeapCorrections.includes(year - 1)) {
    return true
  }
  return (((25 * year + 11) % 33) + 33) % 33 < 8
}

function nowruz(year: number) {
  return Temporal.PlainDate.from({
    calendar: 'persian',
    year,
    monthCode: 'M01',
    day: 1,
  })
}

describe('Persian calendar', () => {
  it('starts 1503 AP on 2124-03-20, after the first corrected year', () => {
    expect(nowruz(1502).toString()).toBe('2123-03-21[u-ca=persian]')
    expect(nowruz(1503).toString()).toBe('2124-03-20[u-ca=persian]')
    expect(nowruz(1502).daysInYear).toBe(365)
    expect(nowruz(1503).daysInYear).toBe(366)
  })

  // ICU4X checked its list against the astronomical calendar from 1178 to 3000 AP
  it('matches the ICU4X leap years from 1178 to 3000 AP', () => {
    for (let year = 1178; year <= 3000; year++) {
      const date = nowruz(year)
      const expectedLeap = isLeapYear(year)

      expect(date.inLeapYear, `${year}`).toBe(expectedLeap)
      expect(date.daysInYear, `${year}`).toBe(expectedLeap ? 366 : 365)
      expect(date.with({ monthCode: 'M12' }).daysInMonth, `${year}`).toBe(
        expectedLeap ? 30 : 29,
      )
    }
  })

  it('reads each year boundary back from ISO from 1178 to 3000 AP', () => {
    for (let year = 1178; year <= 3000; year++) {
      const first = nowruz(year)
      const last = first.with({ monthCode: 'M12', day: first.daysInYear - 336 })
      const fromIso = (date: Temporal.PlainDate) =>
        Temporal.PlainDate.from(date.toString({ calendarName: 'never' }))
          .withCalendar('persian')
          .toString()

      expect(fromIso(first), `${year}`).toBe(first.toString())
      expect(fromIso(last), `${year}`).toBe(last.toString())
      expect(last.add({ days: 1 }).equals(nowruz(year + 1)), `${year}`).toBe(
        true,
      )
    }
  })
})
