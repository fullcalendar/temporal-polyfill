import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'
import { CalendarArg } from './calendar'
import { queryCalendarOps } from './calendarOpsQuery'
import { Instant, InstantArg, createInstant, toInstantSlots } from './instant'
import { formatOffsetNano } from './isoFormat'
import { EpochDisambigOptions, refineEpochDisambigOptions } from './options'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeSlots } from './plainDateTime'
import { getSingleInstantFor, queryTimeZoneOps, queryTimeZonePublic, zonedEpochNanoToIsoWithTZObj } from './timeZoneOps'
import { isTimeZonesEqual, validateOffsetNano } from './timeZoneOps'
import { TimeZoneOpsAdapter } from './timeZoneOpsAdapter'
import { isoCalendarId } from './calendarConfig'
import { ZonedDateTime } from './zonedDateTime'
import { DayTimeNano } from './dayTimeNano'
import { BrandingSlots, CalendarBranding, InstantBranding, PlainDateTimeBranding, TimeZoneBranding, createViaSlots, getSpecificSlots, setSlots } from './slots'
import { defineProps } from './utils'

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
      impl: queryTimeZoneImpl(timeZoneId),
    } as TimeZoneSlots)
  }

  getPossibleInstantsFor(plainDateTimeArg: PlainDateTimeArg): Instant[]  {
    const { impl } = getTimeZoneSlots(this)
    return impl.getPossibleInstantsFor(toPlainDateTimeSlots(plainDateTimeArg))
      .map((epochNano: DayTimeNano) => {
        return createInstant({
          branding: InstantBranding,
          epochNanoseconds: epochNano,
        })
      })
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const { impl } = getTimeZoneSlots(this)
    return impl.getOffsetNanosecondsFor(toInstantSlots(instantArg).epochNanoseconds)
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
      calendar: queryCalendarOps(calendarArg),
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
        new TimeZoneOpsAdapter(this), // needed for internal call to getPossibleInstantsFor
        toPlainDateTimeSlots(plainDateTimeArg),
        refineEpochDisambigOptions(options),
      )
    })
  }

  getNextTransition(instantArg: InstantArg): Instant | null {
    const { impl } = getTimeZoneSlots(this)
    return getImplTransition(1, impl, instantArg)
  }

  getPreviousTransition(instantArg: InstantArg): Instant | null {
    const { impl } = getTimeZoneSlots(this)
    return getImplTransition(-1, impl, instantArg)
  }

  equals(otherArg: TimeZoneArg): boolean {
    getTimeZoneSlots(this) // validate `this`
    return isTimeZonesEqual(this, queryTimeZoneOps(otherArg))
  }

  toString(): string {
    return getTimeZoneSlots(this).impl.id
  }

  toJSON(): string {
    return getTimeZoneSlots(this).impl.id
  }

  get id(): string {
    return getTimeZoneSlots(this).impl.id
  }
}

defineProps(TimeZone.prototype, {
  [Symbol.toStringTag]: 'Temporal.' + TimeZoneBranding,
})

// Utils
// -------------------------------------------------------------------------------------------------

export type TimeZoneSlots = BrandingSlots & { impl: TimeZoneImpl }

export function createTimeZone(slots: TimeZoneSlots): TimeZone {
  return createViaSlots(TimeZone, slots)
}

export function getTimeZoneSlots(timeZone: TimeZone): TimeZoneSlots {
  return getSpecificSlots(CalendarBranding, timeZone) as TimeZoneSlots
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
