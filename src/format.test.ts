import { advanceTo } from 'jest-date-mock'
import { createMarker } from './create'
import { formatNative, formatTimestamp } from './format'

describe('can format into', () => {
  advanceTo()
  const date = new Date()
  const marker = createMarker([
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ])

  test('timestamp', () => {
    expect(formatTimestamp(marker)).toBe(0)
  })

  test('Date', () => {
    expect(formatNative(marker)).toEqual(date)
  })
})
