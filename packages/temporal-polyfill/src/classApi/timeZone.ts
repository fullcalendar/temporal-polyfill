import { isoCalendarId } from '../internal/calendarConfig'
import { isTimeZoneSlotsEqual } from '../internal/compare'
import { DayTimeNano } from '../internal/dayTimeNano'
import { formatOffsetNano } from '../internal/isoFormat'
import {
  EpochDisambigOptions,
  refineEpochDisambigOptions,
} from '../internal/optionsRefine'
import {
  BrandingSlots,
  createInstantSlots,
  createPlainDateTimeSlots,
} from '../internal/slots'
import { epochNanoToIso } from '../internal/timeMath'
import { resolveTimeZoneId } from '../internal/timeZoneId'
import { NativeTimeZone, queryNativeTimeZone } from '../internal/timeZoneNative'
import { getSingleInstantFor } from '../internal/timeZoneOps'
import { CalendarArg } from './calendar'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import {
  PlainDateTime,
  PlainDateTimeArg,
  createPlainDateTime,
  toPlainDateTimeSlots,
} from './plainDateTime'
import { createSlotClass, refineCalendarSlot } from './slotClass'
import { refineTimeZoneSlot } from './slotClass'
import { createAdapterOps, simpleTimeZoneAdapters } from './timeZoneAdapter'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { ZonedDateTime } from './zonedDateTime'

export type TimeZone = any
export type TimeZoneArg = TimeZoneProtocol | string | ZonedDateTime
export type TimeZoneClassSlots = BrandingSlots & {
  id: string
  native: NativeTimeZone
}

export const [TimeZone, createTimeZone] = createSlotClass(
  'TimeZone',
  (id: string): TimeZoneClassSlots => {
    const slotId = resolveTimeZoneId(id)
    const timeZoneNative = queryNativeTimeZone(slotId)
    return {
      branding: 'TimeZone',
      id: slotId,
      native: timeZoneNative,
    }
  },
  {
    id(slots: TimeZoneClassSlots) {
      return slots.id
    },
  },
  {
    toString(slots: TimeZoneClassSlots) {
      return slots.id
    },
    toJSON(slots: TimeZoneClassSlots) {
      return slots.id
    },
    getPossibleInstantsFor(
      { native }: TimeZoneClassSlots,
      plainDateTimeArg: PlainDateTimeArg,
    ): Instant[] {
      return native
        .getPossibleInstantsFor(toPlainDateTimeSlots(plainDateTimeArg))
        .map((epochNano: DayTimeNano) => {
          return createInstant(createInstantSlots(epochNano))
        })
    },
    getOffsetNanosecondsFor(
      { native }: TimeZoneClassSlots,
      instantArg: InstantArg,
    ): number {
      return native.getOffsetNanosecondsFor(
        toInstantSlots(instantArg).epochNanoseconds,
      )
    },
    getOffsetStringFor(
      _slots: TimeZoneClassSlots,
      instantArg: InstantArg,
    ): string {
      const epochNano = toInstantSlots(instantArg).epochNanoseconds
      const calendarOps = createAdapterOps(this, simpleTimeZoneAdapters) // for accessing own methods
      const offsetNano = calendarOps.getOffsetNanosecondsFor(epochNano)

      return formatOffsetNano(offsetNano)
    },
    getPlainDateTimeFor(
      _slots: TimeZoneClassSlots,
      instantArg: InstantArg,
      calendarArg: CalendarArg = isoCalendarId,
    ): PlainDateTime {
      const epochNano = toInstantSlots(instantArg).epochNanoseconds
      const calendarOps = createAdapterOps(this, simpleTimeZoneAdapters) // for accessing own methods
      const offsetNano = calendarOps.getOffsetNanosecondsFor(epochNano)

      return createPlainDateTime(
        createPlainDateTimeSlots(
          epochNanoToIso(epochNano, offsetNano),
          refineCalendarSlot(calendarArg),
        ),
      )
    },
    getInstantFor(
      _slots: TimeZoneClassSlots,
      plainDateTimeArg: PlainDateTimeArg,
      options?: EpochDisambigOptions,
    ): Instant {
      const isoFields = toPlainDateTimeSlots(plainDateTimeArg)
      const epochDisambig = refineEpochDisambigOptions(options)
      const calendarOps = createAdapterOps(this) // for accessing own methods

      return createInstant(
        createInstantSlots(
          getSingleInstantFor(calendarOps, isoFields, epochDisambig),
        ),
      )
    },
    getNextTransition(
      { native }: TimeZoneClassSlots,
      instantArg: InstantArg,
    ): Instant | null {
      return getImplTransition(1, native, instantArg)
    },
    getPreviousTransition(
      { native }: TimeZoneClassSlots,
      instantArg: InstantArg,
    ): Instant | null {
      return getImplTransition(-1, native, instantArg)
    },
    equals(_slots: TimeZoneClassSlots, otherArg: TimeZoneArg): boolean {
      // WEIRD: pass-in `this` as a CalendarProtocol in case subclasses override `id` getter
      // HACK: minification force's isTimeZoneSlotsEqual to 1/0. Ensure boolean.
      return !!isTimeZoneSlotsEqual(this, refineTimeZoneSlot(otherArg))
    },
  },
  {
    from(arg: TimeZoneArg): TimeZoneProtocol {
      const timeZoneSlot = refineTimeZoneSlot(arg)
      return typeof timeZoneSlot === 'string'
        ? new TimeZone(timeZoneSlot)
        : timeZoneSlot
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

function getImplTransition(
  direction: -1 | 1,
  impl: NativeTimeZone,
  instantArg: InstantArg,
): Instant | null {
  const epochNano = impl.getTransition(
    toInstantSlots(instantArg).epochNanoseconds,
    direction,
  )
  return epochNano ? createInstant(createInstantSlots(epochNano)) : null
}
