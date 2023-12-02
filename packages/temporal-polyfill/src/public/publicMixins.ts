import { dateGetterRefiners, timeFieldNamesAlpha } from '../internal/calendarFields'
import { dayTimeNanoToBigInt } from '../internal/dayTimeNano'
import { DurationFieldsWithSign, durationInternalNames } from '../internal/durationFields'
import { IsoDateFields, IsoTimeFields, isoTimeFieldNamesAlpha } from '../internal/isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from '../internal/isoMath'
import { identityFunc, mapPropNames } from '../internal/utils'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { DurationBranding, PlainDateBranding } from '../genericApi/branding'
import { DurationSlots } from '../genericApi/genericTypes'

// public
import { getSpecificSlots, BrandingSlots, IsoDateSlots, EpochSlots } from './slots'
import { createPlainDate } from './plainDate'
import { CalendarProtocol } from './calendar'
import { CalendarSlot } from './calendarSlot'

export function createCalendarGetterMethods(
  branding: string,
  names: string[],
  slotsToIsoFields: ((slots: any) => IsoDateFields) = identityFunc,
) {
  return mapPropNames((name) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoDateSlots)
      const isoFields = slotsToIsoFields(slots)
      return queryCalendarVal(name as string, slots.calendar, isoFields)
    }
  }, names)
}

function queryCalendarVal(
  methodName: string,
  calendarSlot: CalendarSlot,
  isoFields: IsoDateFields,
) {
  return typeof calendarSlot === 'string'
    ? (queryCalendarImpl(calendarSlot) as any)[methodName](isoFields)
    : (dateGetterRefiners as any)[methodName](
        (calendarSlot[methodName as keyof CalendarProtocol] as any)(
          createPlainDate({
            ...isoFields,
            calendar: calendarSlot,
            branding: PlainDateBranding,
          })
        )
      )
}

export function createTimeGetterMethods(
  branding: string,
  slotsToIsoFields: ((slots: any) => IsoTimeFields) = identityFunc,
) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoTimeFields)
      const isoFields = slotsToIsoFields(slots)
      return isoFields[isoTimeFieldNamesAlpha[i]]
    }
  }, timeFieldNamesAlpha)
}

/*
TODO: define using map
*/
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
