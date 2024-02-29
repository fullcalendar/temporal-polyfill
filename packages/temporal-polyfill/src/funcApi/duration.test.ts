import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainDateFns from './plainDate'
import * as PlainDateTimeFns from './plainDateTime'
import { expectDurationEquals } from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

describe('create', () => {
  it('called without args', () => {
    const d = DurationFns.create()
    expectDurationEquals(d, {})
  })

  it('called with some args', () => {
    const d = DurationFns.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    expectDurationEquals(d, {
      years: 1,
      months: 2,
      weeks: 3,
      days: 4,
      hours: 5,
      minutes: 6,
      seconds: 7,
      milliseconds: 8,
      microseconds: 9,
      nanoseconds: 10,
    })
    expect(d.sign).toBe(1)
  })

  it('called with some args (negative)', () => {
    const d = DurationFns.create(-1, -2, -3, -4, -5, -6, -7, -8, -9, -10)
    expectDurationEquals(d, {
      years: -1,
      months: -2,
      weeks: -3,
      days: -4,
      hours: -5,
      minutes: -6,
      seconds: -7,
      milliseconds: -8,
      microseconds: -9,
      nanoseconds: -10,
    })
    expect(d.sign).toBe(-1)
  })
})

describe('fromString', () => {
  it('parses a simple string', () => {
    const d = DurationFns.fromString('P1D')
    expectDurationEquals(d, { days: 1 })
  })
})

describe('fromFields', () => {
  it('refines simple fields', () => {
    const bag = { days: 1 }
    const d = DurationFns.fromFields(bag)
    expectDurationEquals(d, bag)
  })
})

describe('withFields', () => {
  it('modifies fields and returns a new object', () => {
    const d0 = DurationFns.fromFields({ years: 1, months: 1 })
    const d1 = DurationFns.withFields(d0, { months: 2 })
    expectDurationEquals(d1, { years: 1, months: 2 })
  })
})

describe('blank', () => {
  it('gives true for blank duration', () => {
    const d = DurationFns.create()
    expect(DurationFns.blank(d)).toBe(true)
  })

  it('gives false for a non-blank duration', () => {
    const d = DurationFns.create(1)
    expect(DurationFns.blank(d)).toBe(false)
  })
})

describe('negated', () => {
  it('reverses a positive duration to a negative', () => {
    const d = DurationFns.create(1)
    const neg = DurationFns.negated(d)
    expectDurationEquals(neg, { years: -1 })
  })

  it('reverses a negative duration to a positive', () => {
    const d = DurationFns.create(-1)
    const neg = DurationFns.negated(d)
    expectDurationEquals(neg, { years: 1 })
  })
})

describe('abs', () => {
  it('absolutizes a negative duration to positive', () => {
    const d = DurationFns.create(-1)
    const abs = DurationFns.abs(d)
    expectDurationEquals(abs, { years: 1 })
  })

  it('leaves a positive duration untouched', () => {
    const d = DurationFns.create(1)
    const abs = DurationFns.abs(d)
    expectDurationEquals(abs, { years: 1 })
  })
})

describe('add', () => {
  it('advances day units without needing relativeTo', () => {
    const d0 = DurationFns.fromFields({ days: 1, hours: 1 })
    const d1 = DurationFns.fromFields({ days: 2, hours: 3 })
    const sum = DurationFns.add(d0, d1)
    expectDurationEquals(sum, { days: 3, hours: 4 })
  })

  it('advances larger units with PlainDate relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: 1, days: 1 })
    const d1 = DurationFns.fromFields({ months: 2, days: 3 })
    const pd = PlainDateFns.create(2024, 1, 1)
    const sum = DurationFns.add(d0, d1, { relativeTo: pd })
    expectDurationEquals(sum, { months: 3, days: 4 })
  })

  it('advances larger units with PlainDateTime relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: 1, days: 1 })
    const d1 = DurationFns.fromFields({ months: 2, days: 3 })
    const pdt = PlainDateTimeFns.create(2024, 1, 1, 12)
    const sum = DurationFns.add(d0, d1, { relativeTo: pdt })
    expectDurationEquals(sum, { months: 3, days: 4 })
  })

  it('advances larger units with ZonedDateTime relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: 1, days: 1 })
    const d1 = DurationFns.fromFields({ months: 2, days: 3 })
    const zdt = ZonedDateTimeFns.fromString('2024-01-01[America/New_York]')
    const sum = DurationFns.add(d0, d1, { relativeTo: zdt })
    expectDurationEquals(sum, { months: 3, days: 4 })
  })
})

describe('subtract', () => {
  it('advances day units without needing relativeTo', () => {
    const d0 = DurationFns.fromFields({ days: -1, hours: -1 })
    const d1 = DurationFns.fromFields({ days: 2, hours: 3 })
    const diff = DurationFns.subtract(d0, d1)
    expectDurationEquals(diff, { days: -3, hours: -4 })
  })

  it('advances larger units with PlainDate relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: -1, days: -1 })
    const d1 = DurationFns.fromFields({ months: 2, days: 3 })
    const pd = PlainDateFns.create(2024, 1, 1)
    const diff = DurationFns.subtract(d0, d1, { relativeTo: pd })
    expectDurationEquals(diff, { months: -3, days: -4 })
  })

  it('advances larger units with PlainDateTime relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: -1, days: -1 })
    const d1 = DurationFns.fromFields({ months: 2, days: 3 })
    const pdt = PlainDateTimeFns.create(2024, 1, 1, 12)
    const diff = DurationFns.subtract(d0, d1, { relativeTo: pdt })
    expectDurationEquals(diff, { months: -3, days: -4 })
  })

  it('advances larger units with ZonedDateTime relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: -1, days: -1 })
    const d1 = DurationFns.fromFields({ months: 2, days: 3 })
    const zdt = ZonedDateTimeFns.fromString('2024-01-01[America/New_York]')
    const diff = DurationFns.subtract(d0, d1, { relativeTo: zdt })
    expectDurationEquals(diff, { months: -3, days: -4 })
  })
})

describe('round', () => {
  it('rounds days without needing relativeTo', () => {
    const d = DurationFns.fromFields({ days: 1, hours: 13 })
    const rounded = DurationFns.round(d, { smallestUnit: 'days' })
    expectDurationEquals(rounded, { days: 2 })
  })

  it('rounds months with PlainDate relativeTo', () => {
    const d = DurationFns.fromFields({ months: 1, days: 15 })
    const pd = PlainDateFns.create(2024, 1, 1)
    const rounded = DurationFns.round(d, {
      smallestUnit: 'months',
      relativeTo: pd,
    })
    expectDurationEquals(rounded, { months: 2 }) // b/c Feb 2024 has 29 days
  })

  it('rounds months with PlainDateTime relativeTo', () => {
    const d = DurationFns.fromFields({ months: 1, days: 15 })
    const pdt = PlainDateTimeFns.create(2024, 1, 1, 12)
    const rounded = DurationFns.round(d, {
      smallestUnit: 'months',
      relativeTo: pdt,
    })
    expectDurationEquals(rounded, { months: 2 }) // b/c Feb 2024 has 29 days
  })

  it('rounds months with ZonedDateTime relativeTo', () => {
    const d = DurationFns.fromFields({ months: 1, days: 15 })
    const zdt = ZonedDateTimeFns.fromString('2024-01-01[America/New_York]')
    const rounded = DurationFns.round(d, {
      smallestUnit: 'months',
      relativeTo: zdt,
    })
    expectDurationEquals(rounded, { months: 2 }) // b/c Feb 2024 has 29 days
  })
})

describe('total', () => {
  it('totals days without needing relativeTo', () => {
    const d = DurationFns.fromFields({ days: 1, hours: 12 })
    const total = DurationFns.total(d, { unit: 'days' })
    expect(total).toBe(1.5)
  })

  it('totals months with PlainDate relativeTo', () => {
    const d = DurationFns.fromFields({ months: 1, days: 14 })
    const pd = PlainDateFns.create(2023, 1, 1)
    const total = DurationFns.total(d, { unit: 'months', relativeTo: pd })
    expect(total).toBe(1.5) // b/c Feb 2023 has 28 days
  })

  it('totals months with PlainDateTime relativeTo', () => {
    const d = DurationFns.fromFields({ months: 1, days: 14 })
    const pdt = PlainDateTimeFns.create(2023, 1, 1, 12)
    const total = DurationFns.total(d, { unit: 'months', relativeTo: pdt })
    expect(total).toBe(1.5) // b/c Feb 2023 has 28 days
  })

  it('totals months with ZonedDateTime relativeTo', () => {
    const d = DurationFns.fromFields({ months: 1, days: 14 })
    const zdt = ZonedDateTimeFns.fromString('2023-01-01[America/New_York]')
    const total = DurationFns.total(d, { unit: 'months', relativeTo: zdt })
    expect(total).toBe(1.5) // b/c Feb 2023 has 28 days
  })
})

describe('compare', () => {
  it('compares smaller units without needing relativeTo', () => {
    const d0 = DurationFns.fromFields({ days: 1, hours: 2 })
    const d1 = DurationFns.fromFields({ days: 2, hours: 1 })
    expect(DurationFns.compare(d0, d1)).toBe(-1)
    expect(DurationFns.compare(d1, d0)).toBe(1)
  })

  it('compares larger units with PlainDate relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: 1, days: 2 })
    const d1 = DurationFns.fromFields({ months: 2, days: 1 })
    const pd = PlainDateFns.create(2024, 1, 1)
    expect(DurationFns.compare(d0, d1, { relativeTo: pd })).toBe(-1)
    expect(DurationFns.compare(d1, d0, { relativeTo: pd })).toBe(1)
  })

  it('compares larger units with PlainDateTime relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: 1, days: 2 })
    const d1 = DurationFns.fromFields({ months: 2, days: 1 })
    const pdt = PlainDateTimeFns.create(2024, 1, 1, 12)
    expect(DurationFns.compare(d0, d1, { relativeTo: pdt })).toBe(-1)
    expect(DurationFns.compare(d1, d0, { relativeTo: pdt })).toBe(1)
  })

  it('compares larger units with ZonedDateTime relativeTo', () => {
    const d0 = DurationFns.fromFields({ months: 1, days: 2 })
    const d1 = DurationFns.fromFields({ months: 2, days: 1 })
    const zdt = ZonedDateTimeFns.fromString('2024-01-01[America/New_York]')
    expect(DurationFns.compare(d0, d1, { relativeTo: zdt })).toBe(-1)
    expect(DurationFns.compare(d1, d0, { relativeTo: zdt })).toBe(1)
  })
})

describe('toString', () => {
  it('can output day and time units', () => {
    const d = DurationFns.fromFields({ days: 2, hours: 12 })
    const s = DurationFns.toString(d)
    expect(s).toBe('P2DT12H')
  })

  it('can output subsecond units', () => {
    const d = DurationFns.fromFields({ days: 2, hours: 12, milliseconds: 500 })
    const s = DurationFns.toString(d)
    expect(s).toBe('P2DT12H0.5S')
  })

  it('can round subsecond units', () => {
    const d = DurationFns.fromFields({ days: 2, hours: 12, milliseconds: 500 })
    const s = DurationFns.toString(d, {
      smallestUnit: 'seconds',
      roundingMode: 'halfExpand',
    })
    expect(s).toBe('P2DT12H1S')
  })
})

describe('toLocaleString', () => {
  it('most likely falls back to toString', () => {
    const d = DurationFns.fromFields({ days: 2 })
    const s = DurationFns.toLocaleString(d)
    expect(s).toBeTruthy()
  })
})
