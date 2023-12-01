import { dateGetterRefiners, timeFieldNames } from '../internal/calendarFields'
import { dayTimeNanoToBigInt } from '../internal/dayTimeNano'
import { DurationFieldsWithSign, durationInternalNames } from '../internal/durationFields'
import { IsoTimeFields, isoDateFieldNamesDesc, isoTimeFieldNamesAlpha } from '../internal/isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from '../internal/isoMath'
import { mapPropNames, pluckProps } from '../internal/utils'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { getId } from '../internal/idLike'
import { zonedInternalsToIso } from '../internal/timeZoneMath'
import { DurationBranding, PlainDateBranding } from '../genericApi/branding'
import { DurationSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'

// public
import { getSpecificSlots, BrandingSlots, CalendarSlots, IsoDateSlots, EpochSlots } from './slots'
import { createPlainDate } from './plainDate'
import { CalendarProtocol } from './calendar'
import { TimeZoneSlot } from './timeZoneSlot'
import { CalendarSlot } from './calendarSlot'
import { createSimpleTimeZoneRecord } from './recordCreators'

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
      const { calendar, timeZone } = slots
      const timeZoneRecord = createSimpleTimeZoneRecord(timeZone)
      const isoFields = zonedInternalsToIso(slots, timeZoneRecord)

      // TODO: make DRY
      return typeof calendar === 'string'
        ? (queryCalendarImpl(calendar) as any)[name](isoFields)
        : (dateGetterRefiners as any)[name](
            (calendar[name as keyof CalendarProtocol] as any)(
              createPlainDate({
                ...pluckProps(isoDateFieldNamesDesc, isoFields),
                calendar,
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
      return slots[isoTimeFieldNamesAlpha[i]]
    }
  }, timeFieldNames)
}

// YUCK
export function createZonedTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
      const timeZoneRecord = createSimpleTimeZoneRecord(slots.timeZone)

      return zonedInternalsToIso(slots, timeZoneRecord)[isoTimeFieldNamesAlpha[i]]
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
