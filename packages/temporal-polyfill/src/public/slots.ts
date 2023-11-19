import { toInteger } from '../internal/cast'
import { DayTimeNano } from '../internal/dayTimeNano'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, constrainIsoDateLike, constrainIsoDateTimeLike, isoDateFieldRefiners, isoTimeFieldRefiners } from '../internal/isoFields'
import { checkIsoDateInBounds, checkIsoDateTimeInBounds, checkIsoYearMonthInBounds } from '../internal/isoMath'
import { BoundArg, mapPropsWithRefiners, pluckProps } from '../internal/utils'

// public
import { CalendarArg } from './calendar'
import { CalendarSlot, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot } from './timeZoneSlot'

// Types
// -------------------------------------------------------------------------------------------------

export interface BrandingSlots {
  branding: string
}

export interface CalendarSlots {
  calendar: CalendarSlot
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

// hard to get rid of
export interface ZonedEpochSlots extends EpochSlots {
  timeZone: TimeZoneSlot
  calendar: CalendarSlot
}
export type IsoDateSlots = IsoDateFields & CalendarSlots
export type IsoDateTimeSlots = IsoDateSlots & IsoTimeFields

export type PlainYearMonthSlots = { branding: typeof PlainYearMonthBranding } & IsoDateSlots
export type PlainMonthDaySlots = { branding: typeof PlainMonthDayBranding } & IsoDateSlots
export type PlainDateSlots = { branding: typeof PlainDateBranding } & IsoDateSlots
export type PlainDateTimeSlots = { branding: typeof PlainDateTimeBranding } & IsoDateTimeSlots
export type PlainTimeSlots = { branding: typeof PlainTimeBranding } & IsoTimeFields
export type ZonedDateTimeSlots = { branding: typeof ZonedDateTimeBranding } & ZonedEpochSlots
export type InstantSlots = { branding: typeof InstantBranding } & EpochSlots
export type DurationSlots = { branding: typeof DurationBranding } & DurationFieldsWithSign

// Branding
// -------------------------------------------------------------------------------------------------

export const PlainYearMonthBranding = 'PlainYearMonth' as const
export const PlainMonthDayBranding = 'PlainMonthDay' as const
export const PlainDateBranding = 'PlainDate' as const
export const PlainDateTimeBranding = 'PlainDateTime' as const
export const PlainTimeBranding = 'PlainTime' as const
export const ZonedDateTimeBranding = 'ZonedDateTime' as const
export const InstantBranding = 'Instant' as const
export const DurationBranding = 'Duration' as const
export const CalendarBranding = 'Calendar' as const
export const TimeZoneBranding = 'TimeZone' as const

// Lookup
// -------------------------------------------------------------------------------------------------

const slotsMap = new WeakMap<any, BrandingSlots>()

// TODO: allow type-input, so caller doesn't need to cast so much
export const getSlots = slotsMap.get.bind(slotsMap)
export const setSlots = slotsMap.set.bind(slotsMap)

export function createViaSlots(Class: any, slots: BrandingSlots): any {
  const instance = Object.create(Class.prototype)
  setSlots(instance, slots)
  return instance
}

export function getSpecificSlots(branding: string, obj: any): BrandingSlots {
  const slots = getSlots(obj)
  if (!slots || slots.branding !== branding) {
    throw new TypeError('Bad')
  }
  return slots
}

// Refining
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
export const isoDateInternalRefiners = {
  calendar: refineCalendarSlot,
  ...isoDateFieldRefiners,
}

// Unordered
export const isoDateTimeInternalRefiners = {
  ...isoDateInternalRefiners,
  ...isoTimeFieldRefiners,
}

export function refineIsoDateTimeSlots(
  rawIsoDateTimeInternals: IsoDateTimeFields & { calendar: CalendarArg }
): IsoDateTimeSlots {
  return checkIsoDateTimeInBounds(
    constrainIsoDateTimeLike(
      mapPropsWithRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners)
    )
  )
}

export function refineIsoDateSlots(
  rawIsoDateInternals: IsoDateFields & { calendar: CalendarArg }
): IsoDateSlots {
  return checkIsoDateInBounds(
    constrainIsoDateLike(
      mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners)
    )
  )
}

export function refineIsoYearMonthSlots(
  rawIsoDateInternals: IsoDateFields & { calendar: CalendarArg }
): IsoDateSlots {
  return checkIsoYearMonthInBounds(
    constrainIsoDateLike({
      // do in order of PlainYearMonth constructor... WEIRD
      // ALSO: was having weird issue with ordering of prop access with mapPropsWithRefiners
      isoYear: toInteger(rawIsoDateInternals.isoYear),
      isoMonth: toInteger(rawIsoDateInternals.isoMonth),
      calendar: refineCalendarSlot(rawIsoDateInternals.calendar),
      isoDay: toInteger(rawIsoDateInternals.isoDay),
    })
  )
}

export function refineIsoMonthDaySlots(
  rawIsoDateInternals: IsoDateFields & { calendar: CalendarArg }
): IsoDateSlots {
  return checkIsoDateInBounds(
    constrainIsoDateLike({
      // do in order of PlainMonthDay constructor... WEIRD
      // ALSO: was having weird issue with ordering of prop access with mapPropsWithRefiners
      isoMonth: toInteger(rawIsoDateInternals.isoMonth),
      isoDay: toInteger(rawIsoDateInternals.isoDay),
      calendar: refineCalendarSlot(rawIsoDateInternals.calendar),
      isoYear: toInteger(rawIsoDateInternals.isoYear),
    })
  )
}

// Plucking
// -------------------------------------------------------------------------------------------------

const isoDateInternalNames = Object.keys(isoDateInternalRefiners) as
  (keyof IsoDateSlots)[]

const isoDateTimeInternalNames = Object.keys(isoDateTimeInternalRefiners).sort() as
  (keyof IsoDateTimeSlots)[]

export const pluckIsoDateInternals = pluckProps.bind<
  undefined, [BoundArg],
  [IsoDateSlots],
  IsoDateSlots // return
>(undefined, isoDateInternalNames) // bound

export const pluckIsoDateTimeInternals = pluckProps.bind<
  undefined, [BoundArg],
  [IsoDateTimeSlots],
  IsoDateTimeSlots // return
>(undefined, isoDateTimeInternalNames)

// Reject
// -------------------------------------------------------------------------------------------------

export function rejectInvalidBag<B>(bag: B): B {
  if (getSlots(bag)) {
    throw new TypeError('Cant pass a Temporal object')
  }
  if ((bag as any).calendar !== undefined) {
    throw new TypeError('Ah')
  }
  if ((bag as any).timeZone !== undefined) {
    throw new TypeError('Ah')
  }
  return bag
}
