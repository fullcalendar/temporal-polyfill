/* eslint-disable max-len */
import { ZonedDateTime } from './zonedDateTime'

test('can instantiate', () => {
  const date = new ZonedDateTime(0n, 'UTC')
  expect(date).toBeDefined()
})

describe.each`
  epochNanoseconds        | year    | month | day   | hour  | minute | second | millisecond
  ${0n}                   | ${1970} | ${1}  | ${1}  | ${0}  | ${0}   | ${0}   | ${0}
  ${45030500000000n}      | ${1970} | ${1}  | ${1}  | ${12} | ${30}  | ${30}  | ${500}
  ${1608854400000000000n} | ${2020} | ${12} | ${25} | ${0}  | ${0}   | ${0}   | ${0}
`(
  'can get values for %d (%d-%d-%dT%d:%d:%d.%d)',
  ({
    epochNanoseconds,
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
  }) => {
    test('in UTC', () => {
      const date = new ZonedDateTime(epochNanoseconds, 'UTC')
      expect(date.year).toBe(year)
      expect(date.month).toBe(month)
      expect(date.day).toBe(day)
      expect(date.hour).toBe(hour)
      expect(date.minute).toBe(minute)
      expect(date.second).toBe(second)
      expect(date.millisecond).toBe(millisecond)
      // expect(date.toString()).toBe(
      //   `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+00:00`
      // )
    })

    test('in Asia/Tokyo', () => {
      const date = new ZonedDateTime(epochNanoseconds, 'Asia/Tokyo')
      expect(date.year).toBe(year)
      expect(date.month).toBe(month)
      expect(date.day).toBe(day)
      expect(date.hour).toBe(hour + 9)
      expect(date.minute).toBe(minute)
      expect(date.second).toBe(second)
      expect(date.millisecond).toBe(millisecond)
      // expect(date.toString()).toBe(
      //   `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+00:00`
      // )
    })
  },
)

test('can compare two dates', () => {
  const a = new ZonedDateTime(0n, 'UTC')
  const b = new ZonedDateTime(1000000000n, 'UTC')
  const c = new ZonedDateTime(1000000000n, 'UTC')
  expect(ZonedDateTime.compare(a, b)).toBe(-1)
  expect(ZonedDateTime.compare(b, a)).toBe(1)
  expect(ZonedDateTime.compare(b, c)).toBe(0)
})

test.each`
  str                                                       | year | month | day  | hour  | minute | second | millisecond | timeZone        | calendar
  ${'2020-08-05T20:06:13+09:00[Asia/Tokyo][u-ca=japanese]'} | ${2} | ${8}  | ${6} | ${14} | ${6}   | ${13}  | ${0}        | ${'Asia/Tokyo'} | ${'japanese'}
`(
  'can create date from $str',
  ({
    str,
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
    timeZone,
    calendar,
  }) => {
    const zdt = ZonedDateTime.from(str)
    expect(zdt.year).toBe(year)
    expect(zdt.month).toBe(month)
    expect(zdt.day).toBe(day)
    expect(zdt.hour).toBe(hour)
    expect(zdt.minute).toBe(minute)
    expect(zdt.second).toBe(second)
    expect(zdt.millisecond).toBe(millisecond)
    expect(zdt.timeZone.id).toBe(timeZone)
    expect(zdt.calendar.id).toBe(calendar)
  },
)
