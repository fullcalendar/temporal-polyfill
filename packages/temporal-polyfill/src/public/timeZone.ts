import { NativeTimeZone } from '../internal/timeZoneNative'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { formatOffsetNano } from '../internal/formatIso'
import { EpochDisambigOptions, refineEpochDisambigOptions } from '../internal/optionsRefine'
import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { defineStringTag } from '../internal/utils'
import { getSingleInstantFor } from '../internal/timeZoneOps'
import { epochNanoToIso } from '../internal/epochAndTime'

// public
import { refineCalendarSlot } from './calendarSlot'
import { refineTimeZoneSlot } from './timeZoneSlot'
import { createViaSlots, getSpecificSlots, setSlots } from './slotsForClasses'
import { ZonedDateTime } from './zonedDateTime'
import { CalendarArg } from './calendar'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeSlots } from './plainDateTime'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { createAdapterOps, simpleTimeZoneAdapters } from './timeZoneAdapter'
import { ensureString } from '../internal/cast'
import { BrandingSlots, InstantBranding, PlainDateTimeBranding, TimeZoneBranding, isTimeZoneSlotsEqual } from '../internal/slots'

// TimeZone Class
// -------------------------------------------------------------------------------------------------

export type TimeZoneArg = TimeZoneProtocol | string | ZonedDateTime

export class TimeZone implements TimeZoneProtocol {
  constructor(timeZoneId: string) {
    const timeZoneNative = queryNativeTimeZone(ensureString(timeZoneId))

    setSlots(this, {
      branding: TimeZoneBranding,
      id: timeZoneNative.id,
      native: timeZoneNative,
    } as TimeZoneClassSlots)
  }

  getPossibleInstantsFor(plainDateTimeArg: PlainDateTimeArg): Instant[]  {
    const { native } = getTimeZoneSlots(this)
    return native.getPossibleInstantsFor(toPlainDateTimeSlots(plainDateTimeArg))
      .map((epochNano: DayTimeNano) => {
        return createInstant({
          branding: InstantBranding,
          epochNanoseconds: epochNano,
        })
      })
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const { native } = getTimeZoneSlots(this)
    return native.getOffsetNanosecondsFor(toInstantSlots(instantArg).epochNanoseconds)
  }

  getOffsetStringFor(instantArg: InstantArg): string {
    getTimeZoneSlots(this) // validate `this`

    const epochNano = toInstantSlots(instantArg).epochNanoseconds
    const calendarOps = createAdapterOps(this, simpleTimeZoneAdapters) // for accessing own methods
    const offsetNano = calendarOps.getOffsetNanosecondsFor(epochNano)

    return formatOffsetNano(offsetNano)
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: CalendarArg = isoCalendarId
  ): PlainDateTime {
    getTimeZoneSlots(this) // validate `this`

    const epochNano = toInstantSlots(instantArg).epochNanoseconds
    const calendarOps = createAdapterOps(this, simpleTimeZoneAdapters) // for accessing own methods
    const offsetNano = calendarOps.getOffsetNanosecondsFor(epochNano)

    return createPlainDateTime({
      calendar: refineCalendarSlot(calendarArg),
      ...epochNanoToIso(epochNano, offsetNano),
      branding: PlainDateTimeBranding,
    })
  }

  getInstantFor(
    plainDateTimeArg: PlainDateTimeArg,
    options?: EpochDisambigOptions
  ): Instant {
    getTimeZoneSlots(this) // validate `this`

    const isoFields = toPlainDateTimeSlots(plainDateTimeArg)
    const epochDisambig = refineEpochDisambigOptions(options)
    const calendarOps = createAdapterOps(this) // for accessing own methods

    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: getSingleInstantFor(calendarOps, isoFields, epochDisambig),
    })
  }

  getNextTransition(instantArg: InstantArg): Instant | null {
    const { native } = getTimeZoneSlots(this)
    return getImplTransition(1, native, instantArg)
  }

  getPreviousTransition(instantArg: InstantArg): Instant | null {
    const { native } = getTimeZoneSlots(this)
    return getImplTransition(-1, native, instantArg)
  }

  equals(otherArg: TimeZoneArg): boolean {
    getTimeZoneSlots(this) // validate `this`
    // weird: pass-in `this` as a CalendarProtocol in case subclasses override `id` getter
    return isTimeZoneSlotsEqual(this, refineTimeZoneSlot(otherArg))
  }

  // TODO: more DRY
  toString(): string {
    return getTimeZoneSlots(this).id
  }

  // TODO: more DRY
  toJSON(): string {
    return getTimeZoneSlots(this).id
  }

  // TODO: more DRY
  get id(): string {
    return getTimeZoneSlots(this).id
  }

  // TODO: more DRY with constructor, Calendar
  static from(arg: TimeZoneArg): TimeZoneProtocol {
    const timeZoneSlot = refineTimeZoneSlot(arg)
    return typeof timeZoneSlot === 'string'
      ? new TimeZone(timeZoneSlot)
      : timeZoneSlot
  }
}

defineStringTag(TimeZone.prototype, TimeZoneBranding)

// Utils
// -------------------------------------------------------------------------------------------------

export type TimeZoneClassSlots = BrandingSlots & { // TODO: move to top
  id: string
  native: NativeTimeZone
}

export function createTimeZone(slots: TimeZoneClassSlots): TimeZone { // not used
  return createViaSlots(TimeZone, slots)
}

export function getTimeZoneSlots(timeZone: TimeZone): TimeZoneClassSlots {
  return getSpecificSlots(TimeZoneBranding, timeZone) as TimeZoneClassSlots
}

function getImplTransition(direction: -1 | 1, impl: NativeTimeZone, instantArg: InstantArg): Instant | null {
  const epochNano = impl.getTransition(toInstantSlots(instantArg).epochNanoseconds, direction)
  return epochNano ?
    createInstant({
      branding: InstantBranding,
      epochNanoseconds: epochNano,
    }) :
    null
}
