import { createMarker } from '../create'
import {
  getHours,
  getMilliseconds,
  getMinutes,
  getMonth,
  getMonthDay,
  getSeconds,
  getTimeZoneOffset,
  getTimeZoneOffsetForTimestamp,
  getYear,
} from '.'

const unixEpoch = {
  year: 1970,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
}
const date = new Date()
const now = {
  year: date.getUTCFullYear(),
  month: date.getUTCMonth(),
  day: date.getUTCDate(),
  hour: date.getUTCHours(),
  minute: date.getUTCMinutes(),
  second: date.getUTCSeconds(),
  millisecond: date.getUTCMilliseconds(),
}

describe('getYear is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getYear(marker)).toBe(unixEpoch.year)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getYear(marker)).toBe(now.year)
  })
})

describe('getMonth is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getMonth(marker)).toBe(unixEpoch.month)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMonth(marker)).toBe(now.month)
  })
})

describe('getMonthDay is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getMonthDay(marker)).toBe(unixEpoch.day)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMonthDay(marker)).toBe(now.day)
  })
})

describe('getHours is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getHours(marker)).toBe(unixEpoch.hour)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getHours(marker)).toBe(now.hour)
  })
})

describe('getMinutes is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getMinutes(marker)).toBe(unixEpoch.minute)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMinutes(marker)).toBe(now.minute)
  })
})

describe('getSeconds is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getSeconds(marker)).toBe(unixEpoch.second)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getSeconds(marker)).toBe(now.second)
  })
})

describe('getMilliseconds is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getMilliseconds(marker)).toBe(unixEpoch.millisecond)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMilliseconds(marker)).toBe(now.millisecond)
  })
})

describe('TimeZone offset is', () => {
  test('0 in UTC', () => {
    expect(getTimeZoneOffset(createMarker(now), 'utc')).toBe(0)
  })

  test('correctly calculated for local (America/New_York)', () => {
    expect(getTimeZoneOffset(createMarker(now), 'local')).toBe(-240)
  })

  test('throwing for other strings', () => {
    expect(() => {
      getTimeZoneOffset(createMarker(now), 'America/New_York')
    }).toThrow('Unimplemented')
  })
})

describe('TimeZone offset for timestamp is', () => {
  test('0 in UTC', () => {
    expect(getTimeZoneOffsetForTimestamp(Date(), 'utc')).toBe(0)
  })

  test('correctly calculated for local (America/New_York)', () => {
    expect(getTimeZoneOffsetForTimestamp(Date(), 'local')).toBe(-240)
  })

  test('throwing for other strings', () => {
    expect(() => {
      getTimeZoneOffsetForTimestamp(Date(), 'America/New_York')
    }).toThrow('Unimplemented')
  })
})
