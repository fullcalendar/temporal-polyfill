import { dateGetterRefiners, timeFieldNames } from '../internal/calendarFields'
import { dayTimeNanoToBigInt } from '../internal/dayTimeNano'
import { DurationFieldsWithSign, durationInternalNames } from '../internal/durationFields'
import { IsoTimeFields, isoTimeFieldNames } from '../internal/isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from '../internal/isoMath'
import { mapPropNames } from '../internal/utils'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { getId } from '../internal/idLike'
import { DurationBranding, PlainDateBranding } from '../genericApi/branding'
import { DurationSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'

// public
import { getSpecificSlots, BrandingSlots, CalendarSlots, IsoDateSlots, EpochSlots, pluckIsoDateInternals } from './slots'
import { zonedInternalsToIso } from './zonedInternalsToIso'
import { createPlainDate } from './plainDate'
import { CalendarProtocol } from './calendar'
import { TimeZoneSlot } from './timeZoneSlot'
import { CalendarSlot } from './calendarSlot'

// TODO: better types
// TODO: move this out!!!
export function createCalendarIdGetterMethods(branding: string): { calendarId(): string } {
  return {
    calendarId() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & CalendarSlots)
      return getId(slots.calendar)
    }
  }
}

export function createCalendarGetterMethods(
  branding: string,
  names: string[]
) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoDateSlots)
      const { calendar } = slots

      // TODO: make DRY
      return typeof calendar === 'string'
        ? (queryCalendarImpl(calendar) as any)[name](slots)
        : (dateGetterRefiners as any)[name](
            (calendar[name as keyof CalendarProtocol] as any)(
              createPlainDate({
                ...slots,
                branding: PlainDateBranding,
              })
            )
          )
    }
  }, names)
}

// YUCK
export function createZonedCalendarGetterMethods(
  branding: string,
  names: string[]
) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
      const { calendar } = slots
      const isoFields = zonedInternalsToIso(slots)

      // TODO: make DRY
      return typeof calendar === 'string'
        ? (queryCalendarImpl(calendar) as any)[name](isoFields)
        : (dateGetterRefiners as any)[name](
            (calendar[name as keyof CalendarProtocol] as any)(
              createPlainDate({
                ...pluckIsoDateInternals(isoFields),
                branding: PlainDateBranding,
              })
            )
          )
    }
  }, names)
}

export function createTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoTimeFields)
      return slots[isoTimeFieldNames[i]]
    }
  }, timeFieldNames)
}

// YUCK
export function createZonedTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
      return zonedInternalsToIso(slots)[isoTimeFieldNames[i]]
    }
  }, timeFieldNames)
}

export function createEpochGetterMethods(branding: string) {
  return {
    epochSeconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToSec(slots.epochNanoseconds)
    },
    epochMilliseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToMilli(slots.epochNanoseconds)
    },
    epochMicroseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToMicro(slots.epochNanoseconds)
    },
    epochNanoseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return dayTimeNanoToBigInt(slots.epochNanoseconds)
    },
  }
}

/*
Includes sign()
*/
export const durationGettersMethods = mapPropNames((propName: keyof DurationFieldsWithSign) => {
  return function (this: any) {
    const slots = getSpecificSlots(DurationBranding, this) as DurationSlots
    return slots[propName]
  }
}, durationInternalNames)

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}
