import type { Temporal as TemporalSpec } from 'temporal-spec'
import { describe, expect, it } from 'vitest'
import * as Calendar from '../calendar'
import * as Duration from '../shim/duration'
import * as PlainDate from '../shim/plainDate'
import * as PlainDateTime from '../shim/plainDateTime'
import * as ZonedDateTime from '../shim/zonedDateTime'
import { Temporal, durationFields, expectErrorParity } from './testUtils'

describe('Duration fixed arithmetic parity', () => {
  it.each([
    ['add', 'P1DT23H59M59.999999999S', 'PT0.000000001S', 'P2D'],
    ['subtract', 'P1D', 'PT25H', '-PT1H'],
    ['add', '-PT90M', 'PT30M', '-PT60M'],
    ['subtract', 'PT1S', 'PT1S', 'PT0S'],
  ] as const)('%s %s and %s', (method, left, right, expected) => {
    const actual = Duration[method](
      Duration.fromString(left),
      Duration.fromString(right),
    )
    const oracle = Temporal.Duration.from(left)[method](right)
    expect(durationFields(actual)).toStrictEqual(durationFields(oracle))
    expect(durationFields(actual)).toStrictEqual(
      durationFields(Temporal.Duration.from(expected)),
    )
  })

  it.each(['years', 'months', 'weeks'] as const)(
    'rejects %s in either operand',
    (unit) => {
      const calendarDuration = Duration.fromFields({ [unit]: 1 })
      const fixedDuration = Duration.fromFields({ days: 1 })
      for (const method of ['add', 'subtract'] as const) {
        for (const calendarFirst of [true, false]) {
          expectErrorParity(
            () =>
              Duration[method](
                calendarFirst ? calendarDuration : fixedDuration,
                calendarFirst ? fixedDuration : calendarDuration,
              ),
            () =>
              Temporal.Duration.from(
                calendarFirst ? { [unit]: 1 } : { days: 1 },
              )[method](calendarFirst ? { days: 1 } : { [unit]: 1 }),
          )
        }
      }
    },
  )

  it.each([
    [
      '-PT1H7M30S',
      {
        smallestUnit: 'minute',
        roundingIncrement: 15,
        roundingMode: 'halfEven',
      },
    ],
    [
      'P1DT13H',
      { largestUnit: 'day', smallestUnit: 'day', roundingMode: 'halfExpand' },
    ],
  ] as const)('rounds %s without relativeTo', (input, options) => {
    expect(
      durationFields(Duration.round(Duration.fromString(input), options)),
    ).toStrictEqual(
      durationFields(Temporal.Duration.from(input).round(options)),
    )
  })

  it('totals and compares fixed units, preserving a negative result', () => {
    const input = Duration.fromString('-P1DT12H')
    expect(Duration.total(input, 'hours')).toBe(
      Temporal.Duration.from('-P1DT12H').total('hours'),
    )
    expect(Duration.total(input, 'hours')).toBe(-36)
    expect(Duration.compare(input, Duration.fromString('-PT35H'))).toBe(
      Temporal.Duration.compare('-P1DT12H', '-PT35H'),
    )
  })

  it('rejects missing relativeTo and invalid rounding options', () => {
    const input = Duration.fromString('P1M')
    expectErrorParity(
      () => Duration.total(input, 'days'),
      () => Temporal.Duration.from('P1M').total('days'),
    )
    expectErrorParity(
      () => Duration.compare(input, Duration.fromString('P30D')),
      () => Temporal.Duration.compare('P1M', 'P30D'),
    )
    expectErrorParity(
      () => Duration.round(input, 'days'),
      () => Temporal.Duration.from('P1M').round('days'),
    )
    for (const options of [
      { smallestUnit: 'minute', roundingIncrement: 7 },
      { largestUnit: 'second', smallestUnit: 'hour' },
    ] as const) {
      expectErrorParity(
        () => Duration.round(Duration.fromString('PT1H'), options),
        () => Temporal.Duration.from('PT1H').round(options),
      )
    }
  })
})

// PlainDateTime is a separate Func adapter; its time must be discarded just as
// class relativeTo parsing discards the time in an unzoned date-time string.
const contexts = [
  {
    name: 'plain date',
    value: '2024-01-31',
    record: () => PlainDate.fromString('2024-01-31', Calendar.getAny),
    duration: 'P1M15D',
    other: 'P44D',
    unit: 'months',
  },
  {
    name: 'plain date-time',
    value: '2024-01-31T18:45',
    record: () => PlainDateTime.fromString('2024-01-31T18:45', Calendar.getAny),
    duration: 'P1M15D',
    other: 'P44D',
    unit: 'months',
  },
  {
    name: 'spring forward',
    value: '2024-03-09T12:00[America/New_York]',
    record: () =>
      ZonedDateTime.fromString(
        '2024-03-09T12:00[America/New_York]',
        Calendar.getAny,
      ),
    duration: 'P1DT12H',
    other: 'PT36H',
    unit: 'days',
  },
  {
    name: 'fall back',
    value: '2024-11-02T12:00[America/New_York]',
    record: () =>
      ZonedDateTime.fromString(
        '2024-11-02T12:00[America/New_York]',
        Calendar.getAny,
      ),
    duration: 'P1DT12H',
    other: 'PT36H',
    unit: 'days',
  },
] as const

describe.each(contexts)('Duration relative math: $name', (context) => {
  it.each([1, -1])('rounds, totals and compares with sign %s', (sign) => {
    const input = `${sign < 0 ? '-' : ''}${context.duration}`
    const other = `${sign < 0 ? '-' : ''}${context.other}`
    const record = Duration.fromString(input)
    const temporal = Temporal.Duration.from(input)
    const roundOptions = {
      largestUnit: context.unit,
      smallestUnit: 'days',
      roundingMode: 'halfExpand',
    } as const
    expect(
      durationFields(
        Duration.round(record, {
          ...roundOptions,
          relativeTo: context.record(),
        }),
      ),
    ).toStrictEqual(
      durationFields(
        temporal.round({ ...roundOptions, relativeTo: context.value }),
      ),
    )
    expect(
      Duration.total(record, {
        unit: context.unit,
        relativeTo: context.record(),
      }),
    ).toBe(temporal.total({ unit: context.unit, relativeTo: context.value }))
    expect(
      Duration.compare(record, Duration.fromString(other), {
        relativeTo: context.record(),
      }),
    ).toBe(
      Temporal.Duration.compare(input, other, { relativeTo: context.value }),
    )
  })
})

describe('Duration shared-result checks', () => {
  it.each([
    ['2024-03-09T12:00[America/New_York]', 23],
    ['2024-11-02T12:00[America/New_York]', 25],
  ] as const)(
    'one calendar day from %s lasts %s hours',
    (relativeTo, hours) => {
      const options = {
        unit: 'hours',
        relativeTo,
      } satisfies TemporalSpec.DurationTotalOptions
      expect(Temporal.Duration.from('P1D').total(options)).toBe(hours)
      expect(
        Duration.total(Duration.fromString('P1D'), {
          unit: 'hours',
          relativeTo: ZonedDateTime.fromString(relativeTo, Calendar.getAny),
        }),
      ).toBe(hours)
    },
  )

  it('one month from January 31 in a leap year lasts 29 days', () => {
    expect(
      Duration.total(Duration.fromString('P1M'), {
        unit: 'days',
        relativeTo: PlainDate.create(2024, 1, 31),
      }),
    ).toBe(29)
    expect(
      Temporal.Duration.from('P1M').total({
        unit: 'days',
        relativeTo: '2024-01-31',
      }),
    ).toBe(29)
  })
})
