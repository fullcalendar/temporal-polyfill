import { TimeZoneImpl, queryTimeZoneImpl } from '../internal/timeZoneImpl'
import { CalendarArg } from './calendar'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import { formatOffsetNano } from '../internal/isoFormat'
import { EpochDisambigOptions, refineEpochDisambigOptions } from '../internal/options'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeSlots } from './plainDateTime'
import { isoCalendarId } from '../internal/calendarConfig'
import { ZonedDateTime } from './zonedDateTime'
import { DayTimeNano } from '../internal/dayTimeNano'
import { BrandingSlots, InstantBranding, PlainDateTimeBranding, TimeZoneBranding, createViaSlots, getSpecificSlots, setSlots } from '../internal/slots'
import { defineStringTag } from '../internal/utils'
import { refineCalendarSlot } from '../internal/calendarSlot'
import { getSingleInstantFor, isTimeZoneSlotsEqual, refineTimeZoneSlot, refineTimeZoneSlotString, validateOffsetNano } from '../internal/timeZoneSlot'
import { IsoDateTimeFields } from '../internal/isoFields'
import { epochNanoToIso } from '../internal/isoMath'

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
    } as TimeZoneSlots)
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
        this,
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

export type TimeZoneSlots = BrandingSlots & { id: string }

export function createTimeZone(slots: TimeZoneSlots): TimeZone {
  return createViaSlots(TimeZone, slots)
}

export function getTimeZoneSlots(timeZone: TimeZone): TimeZoneSlots {
  return getSpecificSlots(TimeZoneBranding, timeZone) as TimeZoneSlots
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
