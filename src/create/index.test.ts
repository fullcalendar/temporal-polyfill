import { createMarker } from '.'

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
  const marker = createMarker({
    year: 2021,
    month: 1,
    monthDay: 1,
    hours: 12,
    minutes: 30,
    seconds: 30,
    milliseconds: 500,
  })

  expect(marker).toBe(new Date(marker).valueOf())
})
