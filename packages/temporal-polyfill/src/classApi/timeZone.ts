import { NativeTimeZone } from '../internal/timeZoneNative'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { formatOffsetNano } from '../internal/formatIso'
import { EpochDisambigOptions, refineEpochDisambigOptions } from '../internal/optionsRefine'
import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { getSingleInstantFor } from '../internal/timeZoneOps'
import { epochNanoToIso } from '../internal/epochAndTime'
import { createSlotClass, refineCalendarSlot } from './slotsForClasses'
import { refineTimeZoneSlot } from './slotsForClasses'
import { createViaSlots, getSpecificSlots } from './slotsForClasses'
import { ZonedDateTime } from './zonedDateTime'
import { CalendarArg } from './calendar'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeSlots } from './plainDateTime'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { createAdapterOps, simpleTimeZoneAdapters } from './timeZoneAdapter'
import { requireString } from '../internal/cast'
import { BrandingSlots, createInstantSlots, createPlainDateTimeSlots, isTimeZoneSlotsEqual } from '../internal/slots'

export type TimeZone = any
export type TimeZoneArg = TimeZoneProtocol | string | ZonedDateTime
export type TimeZoneClassSlots = BrandingSlots & {
  id: string
  native: NativeTimeZone
}

export const TimeZone = createSlotClass(
  'TimeZone',
  (timeZoneId: string): TimeZoneClassSlots => {
    const timeZoneNative = queryNativeTimeZone(requireString(timeZoneId))
    return {
      branding: 'TimeZone',
      id: timeZoneNative.id,
      native: timeZoneNative,
    }
  },
  {
    id(slots: TimeZoneClassSlots): string {
      return slots.id
    }
  },
  {
    getPossibleInstantsFor({ native }: TimeZoneClassSlots, plainDateTimeArg: PlainDateTimeArg): Instant[]  {
      return native.getPossibleInstantsFor(toPlainDateTimeSlots(plainDateTimeArg))
        .map((epochNano: DayTimeNano) => {
          return createInstant(
            createInstantSlots(epochNano)
          )
        })
    },
    getOffsetNanosecondsFor({ native }: TimeZoneClassSlots, instantArg: InstantArg): number {
      return native.getOffsetNanosecondsFor(toInstantSlots(instantArg).epochNanoseconds)
    },
    getOffsetStringFor(slots: TimeZoneClassSlots, instantArg: InstantArg): string {
      const epochNano = toInstantSlots(instantArg).epochNanoseconds
      const calendarOps = createAdapterOps(this, simpleTimeZoneAdapters) // for accessing own methods
      const offsetNano = calendarOps.getOffsetNanosecondsFor(epochNano)

      return formatOffsetNano(offsetNano)
    },
    getPlainDateTimeFor(
      slots: TimeZoneClassSlots,
      instantArg: InstantArg,
      calendarArg: CalendarArg = isoCalendarId
    ): PlainDateTime {
      const epochNano = toInstantSlots(instantArg).epochNanoseconds
      const calendarOps = createAdapterOps(this, simpleTimeZoneAdapters) // for accessing own methods
      const offsetNano = calendarOps.getOffsetNanosecondsFor(epochNano)

      return createPlainDateTime(
        createPlainDateTimeSlots(
          epochNanoToIso(epochNano, offsetNano),
          refineCalendarSlot(calendarArg),
        )
      )
    },
    getInstantFor(
      slots: TimeZoneClassSlots,
      plainDateTimeArg: PlainDateTimeArg,
      options?: EpochDisambigOptions,
    ): Instant {
      const isoFields = toPlainDateTimeSlots(plainDateTimeArg)
      const epochDisambig = refineEpochDisambigOptions(options)
      const calendarOps = createAdapterOps(this) // for accessing own methods

      return createInstant(
        createInstantSlots(getSingleInstantFor(calendarOps, isoFields, epochDisambig))
      )
    },
    getNextTransition({ native }: TimeZoneClassSlots, instantArg: InstantArg): Instant | null {
      return getImplTransition(1, native, instantArg)
    },
    getPreviousTransition({ native }: TimeZoneClassSlots, instantArg: InstantArg): Instant | null {
      return getImplTransition(-1, native, instantArg)
    },
    equals(slots: TimeZoneClassSlots, otherArg: TimeZoneArg): boolean {
      // weird: pass-in `this` as a CalendarProtocol in case subclasses override `id` getter
      return isTimeZoneSlotsEqual(this, refineTimeZoneSlot(otherArg))
    },
    toString(slots: TimeZoneClassSlots): string {
      return slots.id
    },
    toJSON(slots: TimeZoneClassSlots): string {
      return slots.id
    }
  },
  {
    from(arg: TimeZoneArg): TimeZoneProtocol {
      const timeZoneSlot = refineTimeZoneSlot(arg)
      return typeof timeZoneSlot === 'string'
        ? new TimeZone(timeZoneSlot)
        : timeZoneSlot
    }
  }
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createTimeZone(slots: TimeZoneClassSlots): TimeZone { // not used
  return createViaSlots(TimeZone, slots)
}

export function getTimeZoneSlots(timeZone: TimeZone): TimeZoneClassSlots {
  return getSpecificSlots('TimeZone', timeZone) as TimeZoneClassSlots
}

function getImplTransition(direction: -1 | 1, impl: NativeTimeZone, instantArg: InstantArg): Instant | null {
  const epochNano = impl.getTransition(toInstantSlots(instantArg).epochNanoseconds, direction)
  return epochNano ?
    createInstant(createInstantSlots(epochNano)) :
    null
}
