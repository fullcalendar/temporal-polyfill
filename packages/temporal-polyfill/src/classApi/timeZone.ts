import { BigNano } from '../internal/bigNano'
import { isoCalendarId } from '../internal/calendarConfig'
import { requireString } from '../internal/cast'
import { isTimeZoneSlotsEqual } from '../internal/compare'
import { formatOffsetNano } from '../internal/isoFormat'
import { parseTimeZoneId } from '../internal/isoParse'
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
import { refineTimeZoneId, resolveTimeZoneId } from '../internal/timeZoneId'
import { NativeTimeZone, queryNativeTimeZone } from '../internal/timeZoneNative'
import { getSingleInstantFor } from '../internal/timeZoneOps'
import { isObjectLike } from '../internal/utils'
import { CalendarArg, refineCalendarSlot } from './calendar'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import {
  PlainDateTime,
  PlainDateTimeArg,
  createPlainDateTime,
  toPlainDateTimeSlots,
} from './plainDateTime'
import { createProtocolValidator, createSlotClass, getSlots } from './slotClass'
import {
  createAdapterOps,
  simpleTimeZoneAdapters,
  timeZoneAdapters,
} from './timeZoneAdapter'
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
    const slotId = refineTimeZoneId(id)
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
    getPossibleInstantsFor(
      { native }: TimeZoneClassSlots,
      plainDateTimeArg: PlainDateTimeArg,
    ): Instant[] {
      return native
        .getPossibleInstantsFor(toPlainDateTimeSlots(plainDateTimeArg))
        .map((epochNano: BigNano) => {
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
      return !!isTimeZoneSlotsEqual(this, refineTimeZoneSlot(otherArg))
    },
    toString(slots: TimeZoneClassSlots) {
      return slots.id
    },
    toJSON(slots: TimeZoneClassSlots) {
      return slots.id
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

// Slot
// -----------------------------------------------------------------------------

export type TimeZoneSlot = TimeZoneProtocol | string

export function refineTimeZoneSlot(arg: TimeZoneArg): TimeZoneSlot {
  if (isObjectLike(arg)) {
    return (
      ((getSlots(arg) || {}) as { timeZone?: TimeZoneSlot }).timeZone ||
      validateTimeZoneProtocol(arg)
    )
  }
  return refineTimeZoneSlotString(arg)
}

function refineTimeZoneSlotString(arg: string): string {
  return resolveTimeZoneId(parseTimeZoneId(requireString(arg)))
}

const validateTimeZoneProtocol = createProtocolValidator(
  Object.keys(timeZoneAdapters),
)

// Protocol
// -----------------------------------------------------------------------------
// TODO: eventually use temporal-spec

export interface TimeZoneProtocol {
  id: string
  getOffsetNanosecondsFor(instant: InstantArg): number
  getOffsetStringFor?(instant: InstantArg): string
  getPlainDateTimeFor?(
    instant: InstantArg,
    calendarArg?: CalendarArg,
  ): PlainDateTime
  getInstantFor?(
    dateTime: PlainDateTimeArg,
    options?: EpochDisambigOptions,
  ): Instant
  getNextTransition?(startingPoint: InstantArg): Instant | null
  getPreviousTransition?(startingPoint: InstantArg): Instant | null
  getPossibleInstantsFor(dateTime: PlainDateTimeArg): Instant[]
  toString?(): string
  toJSON?(): string
  equals?(otherArg: TimeZoneArg): boolean
}
