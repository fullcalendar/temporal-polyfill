/* eslint-disable max-len */
import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'

test('can instantiate duration', () => {
  const duration = new Duration(1, 1, 1)
  expect(duration).toBeDefined()
})

describe('duration from', () => {
  test.each`
    thing                      | year | month | day   | hour | min   | sec  | ms
    ${'P1Y1M1DT1H1M1.1S'}      | ${1} | ${1}  | ${1}  | ${1} | ${1}  | ${1} | ${100}
    ${'P40D'}                  | ${0} | ${0}  | ${40} | ${0} | ${0}  | ${0} | ${0}
    ${'P1Y1D'}                 | ${1} | ${0}  | ${1}  | ${0} | ${0}  | ${0} | ${0}
    ${'P3DT4H59M'}             | ${0} | ${0}  | ${3}  | ${4} | ${59} | ${0} | ${0}
    ${'PT2H30M'}               | ${0} | ${0}  | ${0}  | ${2} | ${30} | ${0} | ${0}
    ${'P1M'}                   | ${0} | ${1}  | ${0}  | ${0} | ${0}  | ${0} | ${0}
    ${'PT1M'}                  | ${0} | ${0}  | ${0}  | ${0} | ${1}  | ${0} | ${0}
    ${'PT0.002S'}              | ${0} | ${0}  | ${0}  | ${0} | ${0}  | ${0} | ${2}
    ${'PT0S'}                  | ${0} | ${0}  | ${0}  | ${0} | ${0}  | ${0} | ${0}
    ${'P0D'}                   | ${0} | ${0}  | ${0}  | ${0} | ${0}  | ${0} | ${0}
    ${{ years: 0, months: 0 }} | ${0} | ${0}  | ${0}  | ${0} | ${0}  | ${0} | ${0}
  `(
    'can be parsed from $thing',
    ({ thing, year, month, day, hour, min, sec, ms }) => {
      const duration = Duration.from(thing)
      expect(duration).toBeInstanceOf(Duration)
      expect(duration.years).toBe(year)
      expect(duration.months).toBe(month)
      expect(duration.days).toBe(day)
      expect(duration.hours).toBe(hour)
      expect(duration.minutes).toBe(min)
      expect(duration.seconds).toBe(sec)
      expect(duration.milliseconds).toBe(ms)
    },
  )

  test.each`
    duration                                      | expected
    ${new Duration(1)}                            | ${'P1Y'}
    ${new Duration(0, 1, 0, 10)}                  | ${'P1M10D'}
    ${new Duration(0, 0, 0, 0, 12)}               | ${'PT12H'}
    ${new Duration(1, 0, 0, 10, 12, 30, 30, 100)} | ${'P1Y10DT12H30M30.1S'}
  `('can be created as from $duration', ({ duration, expected }) => {
    expect(duration.toString()).toBe(expected)
  })
})

test.each`
  one                             | two                             | expected
  ${new Duration(0, 0, 0, 1)}     | ${new Duration(0, 0, 0, 1)}     | ${new Duration(0, 0, 0, 2)}
  ${new Duration(0, 0, 0, 1, 12)} | ${new Duration(0, 0, 0, 1, 12)} | ${new Duration(0, 0, 0, 3)}
`('can take $one and add $two', ({ one, two, expected }) => {
  expect(one.add(two)).toEqual(expected)
})

test.each`
  dur                                     | options                                                         | expected
  ${new Duration(0, 0, 0, 0, 130, 20)}    | ${{ unit: 'seconds' }}                                          | ${469200}
  ${new Duration(0, 0, 0, 0, 12, 32, 30)} | ${{ unit: 'minutes' }}                                          | ${752.5}
  ${new Duration(0, 0, 0, 1)}             | ${{ unit: 'minutes' }}                                          | ${1440}
  ${new Duration(0, 0, 0, 1)}             | ${{ unit: 'hours' }}                                            | ${24}
  ${new Duration(0, 0, 0, 1)}             | ${{ unit: 'weeks', relativeTo: new PlainDateTime(2000, 1, 1) }} | ${1 / 7}
  ${new Duration(0, 0, 1, 1)}             | ${{ unit: 'weeks', relativeTo: new PlainDateTime(2000, 1, 1) }} | ${8 / 7}
`(
  'can find total of $dur with $options to be $expected',
  ({ dur, options, expected }) => {
    expect(dur.total(options)).toBe(expected)
  },
)

test.each`
  dur                                         | options                     | expected
  ${new Duration(0, 0, 0, 1)}                 | ${{ largestUnit: 'hours' }} | ${new Duration(0, 0, 0, 0, 24)}
  ${new Duration(0, 0, 0, 0, 0, 100)}         | ${{ largestUnit: 'hours' }} | ${new Duration(0, 0, 0, 0, 1, 40)}
  ${new Duration(0, 0, 0, 0, 1, 120, 50, 10)} | ${{ largestUnit: 'hours' }} | ${new Duration(0, 0, 0, 0, 3, 0, 50, 10)}
`('can round $dur', ({ dur, options, expected }) => {
  expect(dur.round(options)).toEqual(expected)
})

test('can zero out values using with', () => {
  const dur = new Duration(10, 10, 10, 10, 10, 10, 10, 10)
  expect(dur.with({ years: 0, months: 0, weeks: 0 })).toEqual(
    new Duration(0, 0, 0, 10, 10, 10, 10, 10),
  )
})

test('can format a lone nanosecond correctly', () => {
  const dur = new Duration(0, 0, 0, 0, 0, 0, 0, 0, 0, 1)
  expect(dur.toString()).toBe('PT0.000000001S')
})

test('can format a lone microsecond correctly', () => {
  const dur = new Duration(0, 0, 0, 0, 0, 0, 0, 0, 1)
  expect(dur.toString()).toBe('PT0.000001S')
})
