import {
  setYear,
  setMonth,
  setMonthDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from '.'
import createMarker from '../create'

describe('setYear is able to', () => {
  test('set to 2000', () => {
    expect(setYear(createMarker([1970]), 2000)).toBe(createMarker([2000]))
  })

  test('set to 1000', () => {
    expect(setYear(createMarker([2000]), 1000)).toBe(createMarker([1000]))
  })
})

describe('setMonth is able to', () => {
  test('set to January', () => {
    expect(setMonth(createMarker([1970, 12]), 1)).toBe(createMarker([1970, 1]))
  })
})

describe('setMonthDay is able to', () => {
  test('set to 1st', () => {
    expect(setMonthDay(createMarker([1970, 1, 15]), 1)).toBe(
      createMarker([1970, 1, 1])
    )
  })
})

describe('setHours is able to', () => {
  test('set to 1:00', () => {
    expect(setHours(createMarker([1970, 1, 15, 12]), 1)).toBe(
      createMarker([1970, 1, 15, 1])
    )
  })
})

describe('setMinutes is able to', () => {
  test('set to :01', () => {
    expect(setMinutes(createMarker([1970, 1, 15, 12, 30]), 1)).toBe(
      createMarker([1970, 1, 15, 12, 1])
    )
  })
})

describe('setSeconds is able to', () => {
  test('set to 12:30:01 ', () => {
    expect(setSeconds(createMarker([1970, 1, 15, 12, 30, 30]), 1)).toBe(
      createMarker([1970, 1, 15, 12, 30, 1])
    )
  })
})

describe('setMilliseconds is able to', () => {
  test('set to 12:30:30:01 ', () => {
    expect(
      setMilliseconds(createMarker([1970, 1, 15, 12, 30, 30, 500]), 1)
    ).toBe(createMarker([1970, 1, 15, 12, 30, 30, 1]))
  })
})
