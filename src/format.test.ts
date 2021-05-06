import { createMarker } from './create'
import { formatNative, formatTimestamp } from './format'

jest.useFakeTimers('modern')

const date = new Date()
const marker = createMarker([
  date.getUTCFullYear(),
  date.getUTCMonth() + 1,
  date.getUTCDate(),
  date.getUTCHours(),
  date.getUTCMinutes(),
  date.getUTCSeconds(),
  date.getUTCMilliseconds(),
])

describe('can format into', () => {
  test('timestamp', () => {
    expect(formatTimestamp(marker)).toBe(date.valueOf())
  })

  test('Date', () => {
    expect(formatNative(marker)).toEqual(date)
  })
})
