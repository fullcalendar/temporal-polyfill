import { TimeZoneImpl, queryTimeZoneImpl } from '../internal/timeZoneImpl'
import { formatOffsetNano } from '../internal/isoFormat'
import { EpochDisambigOptions, refineEpochDisambigOptions } from '../internal/options'
import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { defineStringTag } from '../internal/utils'
import { getSingleInstantFor, validateOffsetNano } from '../internal/timeZoneMath'
import { IsoDateTimeFields } from '../internal/isoFields'
import { epochNanoToIso } from '../internal/isoMath'
import { isTimeZoneSlotsEqual } from '../internal/idLike'
import { InstantBranding, PlainDateTimeBranding, TimeZoneBranding } from '../genericApi/branding'
import { refineTimeZoneSlotString } from '../genericApi/timeZoneSlotString'

// public
import { refineCalendarSlot } from './calendarSlot'
import { refineTimeZoneSlot } from './timeZoneSlot'
import { BrandingSlots, createViaSlots, getSpecificSlots, setSlots } from './slots'
import { ZonedDateTime } from './zonedDateTime'
import { CalendarArg } from './calendar'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeSlots } from './plainDateTime'
import { createTypicalTimeZoneRecord } from './recordCreators'

// TimeZone Protocol
// -------------------------------------------------------------------------------------------------

interface TimeZoneProtocolMethods {
  getOffsetNanosecondsFor(instant: InstantArg): number
  getOffsetStringFor?(instant: InstantArg): string
  getPlainDateTimeFor?(instant: InstantArg, calendarArg?: CalendarArg): PlainDateTime
  getInstantFor?(dateTime: PlainDateTimeArg, options?: EpochDisambigOptions): Instant
  getNextTransition?(startingPoint: InstantArg): Instant | null
  getPreviousTransition?(startingPoint: InstantArg): Instant | null
  getPossibleInstantsFor(dateTime: PlainDateTimeArg): Instant[]
  toString?(): string
  toJSON?(): string
  equals?(otherArg: TimeZoneArg): boolean
}

export interface TimeZoneProtocol extends TimeZoneProtocolMethods {
  id: string
}

// TimeZone Class
// -------------------------------------------------------------------------------------------------

export type TimeZoneArg = TimeZoneProtocol | string | ZonedDateTime

export class TimeZone { // implements TimeZoneProtocol
  constructor(timeZoneId: string) {
    setSlots(this, {
      branding: TimeZoneBranding,
      id: refineTimeZoneSlotString(timeZoneId),
    } as TimeZoneClassSlots)
  }

  getPossibleInstantsFor(plainDateTimeArg: PlainDateTimeArg): Instant[]  {
    const { id } = getTimeZoneSlots(this)
    return queryTimeZoneImpl(id).getPossibleInstantsFor(toPlainDateTimeSlots(plainDateTimeArg))
      .map((epochNano: DayTimeNano) => {
        return createInstant({
          branding: InstantBranding,
          epochNanoseconds: epochNano,
        })
      })
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const { id } = getTimeZoneSlots(this)
    return queryTimeZoneImpl(id).getOffsetNanosecondsFor(toInstantSlots(instantArg).epochNanoseconds)
  }

  getOffsetStringFor(instantArg: InstantArg): string {
    getTimeZoneSlots(this) // validate `this`
    return formatOffsetNano(
      // strange we leverage the TimeZone here, but necessary for TimeZone subclasses
      // COPIED from timeZoneOpsAdapterMethods::getOffsetNanosecondsFor
      validateOffsetNano(this.getOffsetNanosecondsFor(createInstant(toInstantSlots(instantArg))))
    )
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: CalendarArg = isoCalendarId
  ): PlainDateTime {
    getTimeZoneSlots(this) // validate `this`

    const epochNano = toInstantSlots(instantArg).epochNanoseconds

    return createPlainDateTime({
      calendar: refineCalendarSlot(calendarArg),
      ...zonedEpochNanoToIsoWithTZObj(this, epochNano),
      branding: PlainDateTimeBranding,
    })
  }

  getInstantFor(
    plainDateTimeArg: PlainDateTimeArg,
    options?: EpochDisambigOptions
  ): Instant {
    getTimeZoneSlots(this) // validate `this`

    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: getSingleInstantFor(
        createTypicalTimeZoneRecord(this), // use protocol so other methods accessed
        toPlainDateTimeSlots(plainDateTimeArg),
        refineEpochDisambigOptions(options),
      )
    })
  }

  getNextTransition(instantArg: InstantArg): Instant | null {
    const { id } = getTimeZoneSlots(this)
    return getImplTransition(1, queryTimeZoneImpl(id), instantArg)
  }

  getPreviousTransition(instantArg: InstantArg): Instant | null {
    const { id } = getTimeZoneSlots(this)
    return getImplTransition(-1, queryTimeZoneImpl(id), instantArg)
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
      ? createTimeZone({ branding: TimeZoneBranding, id: timeZoneSlot })
      : timeZoneSlot
  }
}

defineStringTag(TimeZone.prototype, TimeZoneBranding)

// Utils
// -------------------------------------------------------------------------------------------------

export type TimeZoneClassSlots = BrandingSlots & { id: string }

export function createTimeZone(slots: TimeZoneClassSlots): TimeZone {
  return createViaSlots(TimeZone, slots)
}

export function getTimeZoneSlots(timeZone: TimeZone): TimeZoneClassSlots {
  return getSpecificSlots(TimeZoneBranding, timeZone) as TimeZoneClassSlots
}

function getImplTransition(direction: -1 | 1, impl: TimeZoneImpl, instantArg: InstantArg): Instant | null {
  const epochNano = impl.getTransition(toInstantSlots(instantArg).epochNanoseconds, direction)
  return epochNano ?
    createInstant({
      branding: InstantBranding,
      epochNanoseconds: epochNano,
    }) :
    null
}

// YUCK
function zonedEpochNanoToIsoWithTZObj(
  timeZone: TimeZone,
  epochNano: DayTimeNano,
): IsoDateTimeFields {
  // emulate what TimeZone::getOffsetNanosecondsFor does
  const offsetNano = validateOffsetNano(
    timeZone.getOffsetNanosecondsFor(
      createInstant({
        branding: InstantBranding,
        epochNanoseconds: epochNano
      })
    )
  )
  return epochNanoToIso(epochNano, offsetNano)
}
