import { Instant, PlainDateTime, TimeZone } from '../dist/index'

test('can create with variable', () => {
  const tz = 'local'
  expect(new TimeZone(tz)).toBeDefined()
})

test('timezone for tests is America/New_York', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
    'America/New_York',
  )
})

describe('can get timezone offset milliseconds', () => {
  test.each`
    epochNanoseconds | offsetNanoseconds
    ${0n}            | ${0}
    ${100000000000n} | ${0}
  `('in UTC for $epochNanoseconds to be $offset', ({ epochNanoseconds, offsetNanoseconds }) => {
    const tz = new TimeZone('UTC')
    expect(tz.getOffsetNanosecondsFor(new Instant(epochNanoseconds))).toBe(offsetNanoseconds)
  })

  test.each`
    epochNanoseconds | offsetNanoseconds
    ${0n}            | ${-18000000000000}
    ${100000000000n} | ${-18000000000000}
  `(
    'in local epochNanoseconds (America/New_York) for $epochNanoseconds to be $offsetNanoseconds',
    ({ epochNanoseconds, offsetNanoseconds }) => {
      const tz = new TimeZone('local')
      expect(tz.getOffsetNanosecondsFor(new Instant(epochNanoseconds))).toBe(offsetNanoseconds)
    },
  )

  test.each`
    timeZone              | pdt                              | offsetNanoseconds
    ${'Asia/Tokyo'}       | ${new PlainDateTime(1970, 1, 1)} | ${3.24e13}
    ${'America/New_York'} | ${new PlainDateTime(2000, 1, 1)} | ${-1.8e13}
    ${'America/Chicago'}  | ${new PlainDateTime(2021, 6, 8)} | ${-1.8e13}
    ${'Asia/Shanghai'}    | ${new PlainDateTime(2021, 6, 8)} | ${2.88e13}
  `('in an arbitrary timezone($timeZone)', ({ timeZone, pdt, offsetNanoseconds }) => {
    const tz = new TimeZone(timeZone)
    expect(tz.getOffsetNanosecondsFor(new Instant(pdt.epochNanoseconds))).toBe(offsetNanoseconds)
  })
})

describe('can get offset string', () => {
  test.each`
    epochNanoseconds | str
    ${0n}            | ${'-05:00'}
    ${100000000000n} | ${'-05:00'}
  `('for epoch at %d to be %s', ({ epochNanoseconds, str }) => {
    const tz = new TimeZone('UTC')
    expect(tz.getOffsetStringFor(new Instant(epochNanoseconds))).toBe(str)
  })
})

describe('can get PlainDateTime', () => {
  test('in UTC', () => {
    const tz = new TimeZone('UTC')
    expect(tz.getPlainDateTimeFor(new Instant(0n))).toEqual(new PlainDateTime(1970, 1, 1))
  })
})

describe('can get Instant', () => {
  test('for America/New_York', () => {
    const tz = new TimeZone('America/New_York')
    const date = new PlainDateTime(1970, 1, 1)
    expect(tz.getInstantFor(date).epochNanoseconds).toBe(-1.8e13)
  })
})
