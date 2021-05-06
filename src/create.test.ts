import { advanceTo } from 'jest-date-mock'
import { createMarker } from './create'

describe('create marker from', () => {
  test('object', () => {
    expect(createMarker({ year: 1970 })).toBe(0)
  })

  test('array', () => {
    expect(createMarker([1970])).toBe(0)
  })

  test('object variable', () => {
    const obj = { year: 1970 }
    expect(createMarker(obj)).toBe(0)
  })

  test('array variable', () => {
    const arr: [number] = [1970]
    expect(createMarker(arr)).toBe(0)
  })
})

test('equivalent to JS date value from object', () => {
  advanceTo(0)
  expect(
    createMarker({
      year: 1970,
      month: 1,
      monthDay: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    })
  ).toBe(0)
})
