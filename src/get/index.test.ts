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
  monthDay: 1,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
}
const date = new Date()
const now = {
  year: date.getUTCFullYear(),
  month: date.getUTCMonth(),
  monthDay: date.getUTCDate(),
  hours: date.getUTCHours(),
  minutes: date.getUTCMinutes(),
  seconds: date.getUTCSeconds(),
  milliseconds: date.getUTCMilliseconds(),
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
    expect(getMonthDay(marker)).toBe(unixEpoch.monthDay)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMonthDay(marker)).toBe(now.monthDay)
  })
})

describe('getHours is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getHours(marker)).toBe(unixEpoch.hours)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getHours(marker)).toBe(now.hours)
  })
})

describe('getMinutes is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getMinutes(marker)).toBe(unixEpoch.minutes)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMinutes(marker)).toBe(now.minutes)
  })
})

describe('getSeconds is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getSeconds(marker)).toBe(unixEpoch.seconds)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getSeconds(marker)).toBe(now.seconds)
  })
})

describe('getMilliseconds is able to', () => {
  test('get epoch', () => {
    const marker = createMarker(unixEpoch)
    expect(getMilliseconds(marker)).toBe(unixEpoch.milliseconds)
  })

  test('get current', () => {
    const marker = createMarker(now)
    expect(getMilliseconds(marker)).toBe(now.milliseconds)
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
    expect(getTimeZoneOffsetForTimestamp(new Date().valueOf(), 'utc')).toBe(0)
  })

  test('correctly calculated for local (America/New_York)', () => {
    expect(getTimeZoneOffsetForTimestamp(new Date().valueOf(), 'local')).toBe(
      -240
    )
  })

  test('throwing for other strings', () => {
    expect(() => {
      getTimeZoneOffsetForTimestamp(new Date().valueOf(), 'America/New_York')
    }).toThrow('Unimplemented')
  })
})
