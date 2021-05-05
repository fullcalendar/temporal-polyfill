import { createMarker } from '.'

test('create marker from object', () => {
  expect(createMarker({ year: 1970 })).toBe(0)
})

test('create marker from array', () => {
  expect(createMarker([1970])).toBe(0)
})

test('equivalent to JS date value from object', () => {
  const marker = createMarker({
    year: 2021,
    month: 1,
    day: 1,
    hour: 12,
    minute: 30,
    second: 30,
    millisecond: 500,
  })

  expect(marker).toBe(new Date(marker).valueOf())
})
