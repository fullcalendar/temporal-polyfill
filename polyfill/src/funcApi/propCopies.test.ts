import { describe, expect, it } from 'vitest'
import * as CalendarFns from './calendar'
import * as DurationFns from './duration'
import * as InstantFns from './instant'
import * as PlainDateFns from './plainDate'
import * as PlainTimeFns from './plainTime'
import { withCountedOption } from './testUtils'
import * as ZonedDateTimeFns from './zonedDateTime'

/*
Where the native branch copies an options or fields object before handing it to
native Temporal (see native/refineProps.ts), both branches must still accept
the same objects. Properties inherited through a prototype count like own ones,
and the property being refined is read only once. These run on whichever branch
the host selects.
*/

const inherit = <O extends object>(props: O): O => Object.create(props)
const relativeTo = PlainDateFns.create(2024, 1, 1)
const month = DurationFns.fromFields({ months: 1 })

describe('inherited options', () => {
  it('reach Duration.round, total and compare', () => {
    expect(
      DurationFns.toString(
        DurationFns.round(
          month,
          inherit({ largestUnit: 'days' as const, relativeTo }),
        ),
      ),
    ).toBe('P31D')
    expect(
      DurationFns.total(month, inherit({ unit: 'days' as const, relativeTo })),
    ).toBe(31)
    expect(
      DurationFns.compare(
        month,
        DurationFns.fromFields({ days: 30 }),
        inherit({ relativeTo }),
      ),
    ).toBe(1)
  })

  it('reach PlainDate.toZonedDateTime', () => {
    const zdt = PlainDateFns.toZonedDateTime(
      relativeTo,
      inherit({ timeZone: 'UTC', plainTime: PlainTimeFns.create(12) }),
    )
    expect(ZonedDateTimeFns.toString(zdt)).toBe(
      '2024-01-01T12:00:00+00:00[UTC]',
    )
  })

  it('reach the roundTo* functions', () => {
    const instant = InstantFns.fromEpochMilliseconds(90_000)
    expect(
      InstantFns.toString(
        InstantFns.roundToMinute(
          instant,
          inherit({ roundingMode: 'floor' as const }),
        ),
      ),
    ).toBe('1970-01-01T00:01:00Z')
    expect(
      PlainDateFns.toString(
        PlainDateFns.roundToMonth(
          PlainDateFns.create(2024, 1, 20),
          inherit({ roundingMode: 'floor' as const }),
        ),
      ),
    ).toBe('2024-01-01')
  })
})

describe('inherited fields', () => {
  it('reach PlainDate.fromFields', () => {
    expect(
      PlainDateFns.toString(
        PlainDateFns.fromFields(
          inherit({
            calendar: CalendarFns.getBasic('iso8601'),
            year: 2024,
            month: 1,
            day: 2,
          }),
        ),
      ),
    ).toBe('2024-01-02')
  })

  it('reach ZonedDateTime.fromFields', () => {
    const zdt = ZonedDateTimeFns.fromFields(
      inherit({ timeZone: 'UTC', year: 2024, month: 1, day: 2 }),
    )
    expect(ZonedDateTimeFns.toString(zdt)).toBe(
      '2024-01-02T00:00:00+00:00[UTC]',
    )
  })
})

describe('refined props are read once', () => {
  it('in PlainDate.fromFields', () => {
    const [fields, getReadCount] = withCountedOption(
      { year: 2024, month: 1, day: 2 },
      'calendar',
      CalendarFns.getBasic('iso8601'),
    )
    PlainDateFns.fromFields(fields as any)
    expect(getReadCount()).toBe(1)
  })

  it('in ZonedDateTime.fromFields', () => {
    const [fields, getReadCount] = withCountedOption(
      { year: 2024, month: 1, day: 2 },
      'timeZone',
      'UTC',
    )
    ZonedDateTimeFns.fromFields(fields as any)
    expect(getReadCount()).toBe(1)
  })

  it('in the calendar roundTo* functions', () => {
    const [options, getReadCount] = withCountedOption(
      {},
      'roundingIncrement',
      1,
    )
    PlainDateFns.roundToMonth(PlainDateFns.create(2024, 1, 20), options)
    expect(getReadCount()).toBe(1)
  })
})
