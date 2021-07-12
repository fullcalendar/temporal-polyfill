import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { ZonedDateTime } from './zonedDateTime'

test('can instantiate', () => {
  const date = new PlainDateTime(1970, 1, 1)
  expect(date).toBeDefined()
})

test('is equivalent to utc ZonedDateTime', () => {
  const pdt = new PlainDateTime(1970, 1, 1, 0, 0, 0, 1)
  const zdt = new ZonedDateTime(1, 'utc')
  expect(pdt.toZonedDateTime('utc')).toEqual(zdt)
  expect(pdt.year).toBe(zdt.year)
  expect(pdt.month).toBe(zdt.month)
  expect(pdt.day).toBe(zdt.day)
  expect(pdt.hour).toBe(zdt.hour)
  expect(pdt.minute).toBe(zdt.minute)
  expect(pdt.second).toBe(zdt.second)
  expect(pdt.millisecond).toBe(zdt.millisecond)
})

test.each`
  year    | month | day   | hour  | minute | second | millisecond
  ${1970} | ${1}  | ${1}  | ${0}  | ${0}   | ${0}   | ${0}
  ${1970} | ${1}  | ${1}  | ${12} | ${30}  | ${30}  | ${500}
  ${2020} | ${12} | ${25} | ${0}  | ${0}   | ${0}   | ${0}
`(
  'can get values for $year-$month-$dayT$hour:$minute:$second.$millisecond',
  ({ year, month, day, hour, minute, second, millisecond }) => {
    const date = new PlainDateTime(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond
    )
    expect(date.year).toBe(year)
    expect(date.month).toBe(month)
    expect(date.day).toBe(day)
    expect(date.hour).toBe(hour)
    expect(date.minute).toBe(minute)
    expect(date.second).toBe(second)
    expect(date.millisecond).toBe(millisecond)
    // expect(date.toString()).toBe(
    //   `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}`
    // )
  }
)

test.each`
  add                                           | orig                              | expected
  ${'P1Y'}                                      | ${new PlainDateTime(1970, 1, 1)}  | ${new PlainDateTime(1971, 1, 1)}
  ${'P1Y1M1D'}                                  | ${new PlainDateTime(2000, 1, 1)}  | ${new PlainDateTime(2001, 2, 2)}
  ${{ years: 1 }}                               | ${new PlainDateTime(1970, 1, 1)}  | ${new PlainDateTime(1971, 1, 1)}
  ${{ years: 1, months: 1, days: 1, hours: 1 }} | ${new PlainDateTime(2020, 1, 1)}  | ${new PlainDateTime(2021, 2, 2, 1)}
  ${{ months: 1 }}                              | ${new PlainDateTime(1982, 12, 1)} | ${new PlainDateTime(1983, 1, 1)}
`('can add %s + %s', ({ add, orig, expected }) => {
  expect(orig.add(add).epochMilliseconds).toBe(expected.epochMilliseconds)
})

test.each`
  date                                        | other                                | expected
  ${new PlainDateTime(1970, 1, 1)}            | ${new PlainDateTime(1970, 1, 2)}     | ${new Duration(0, 0, 0, -1)}
  ${new PlainDateTime(1970, 2, 5)}            | ${new PlainDateTime(1970, 1, 1)}     | ${new Duration(0, 1, 0, 4)}
  ${new PlainDateTime(1970, 1, 1, 3, 30, 30)} | ${new PlainDateTime(1970, 1, 1, 1)}  | ${new Duration(0, 0, 0, 0, 2, 30, 30)}
  ${new PlainDateTime(2020, 2, 9)}            | ${new PlainDateTime(2010, 1, 1)}     | ${new Duration(10, 1, 0, 8)}
  ${new PlainDateTime(2020, 6, 2, 11)}        | ${new PlainDateTime(2020, 6, 1, 12)} | ${new Duration(0, 0, 0, 0, 23)}
`('can get duration till %s since %s', ({ date, other, expected }) => {
  expect(date.since(other, { largestUnit: 'years' })).toEqual(expected)
})

test.each`
  date                                         | expected                                     | options
  ${new PlainDateTime(1970, 1, 1, 0, 55)}      | ${new PlainDateTime(1970, 1, 1, 1)}          | ${{ smallestUnit: 'hours', roundingMode: 'halfExpand' }}
  ${new PlainDateTime(1970, 1, 1, 1, 1, 1, 1)} | ${new PlainDateTime(1970, 1, 1, 1, 1, 1, 1)} | ${{}}
  ${new PlainDateTime(2000, 1, 1, 1)}          | ${new PlainDateTime(2000, 1, 2)}             | ${{ smallestUnit: 'days', roundingMode: 'ceil' }}
`('can round %s', ({ date, expected, options }) => {
  expect(date.round(options)).toEqual(expected)
})

test('can zero out values using with', () => {
  const date = new PlainDateTime(1970, 1, 1, 10, 10, 10, 10)
  expect(
    date.with({ isoHour: 0, isoMinute: 0, isoSecond: 0, isoMillisecond: 0 })
  ).toEqual(new PlainDateTime(1970, 1, 1, 0, 0, 0, 0))
})
