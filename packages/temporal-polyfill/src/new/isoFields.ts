import { queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import { toInteger } from './options'
import { mapPropNamesToConstant, pluckProps } from './utils'

export interface IsoDateFields {
  isoDay: number
  isoMonth: number
  isoYear: number
}

export interface IsoTimeFields {
  isoNanosecond: number,
  isoMicrosecond: number,
  isoMillisecond: number,
  isoSecond: number,
  isoMinute: number,
  isoHour: number,
}

// TODO: temporary
export interface CalendarOps {
  id: string
  era(isoFields: IsoDateFields): string | undefined
  eraYear(isoFields: IsoDateFields): number | undefined
  year(isoFields: IsoDateFields): number
  monthCode(isoFields: IsoDateFields): string
  month(isoFields: IsoDateFields): number
  day(isoFields: IsoDateFields): number
  daysInYear(isoFields: IsoDateFields): number
  inLeapYear(isoFields: IsoDateFields): number
  monthsInYear(isoFields: IsoDateFields): number
  daysInMonth(isoFields: IsoDateFields): number
  dayOfWeek(isoFields: IsoDateFields): number
  dayOfYear(isoFields: IsoDateFields): number
  weekOfYear(isoFields: IsoDateFields): number
  yearOfWeek(isoFields: IsoDateFields): number
  daysInWeek(isoFields: IsoDateFields): number
}

// TODO: move
type CalendarIdOrObj = string | CalendarOps

export interface CalendarInternals {
  calendar: CalendarOps
}

export type IsoDateInternals = IsoDateFields & CalendarInternals
type IsoDateTimeFields = IsoDateFields & IsoTimeFields
type IsoDateTimeInternals = IsoDateInternals & IsoTimeFields

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
export const isoDateInternalRefiners = {
  calendar: queryCalendarOps,
  isoDay: toInteger, // happens to be ascending
  isoMonth: toInteger, // "
  isoYear: toInteger, // "
}

// Ordered by ascending size
export const isoTimeFieldRefiners = {
  isoNanosecond: toInteger,
  isoMicrosecond: toInteger,
  isoMillisecond: toInteger,
  isoSecond: toInteger,
  isoMinute: toInteger,
  isoHour: toInteger,
}

// Unordered
export const isoDateTimeInternalRefiners = {
  ...isoDateInternalRefiners,
  ...isoTimeFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

const isoDateInternalNames = Object.keys(isoDateInternalRefiners) as
  (keyof IsoDateInternals)[]

export const isoDateTimeInternalNames = Object.keys(isoDateTimeInternalRefiners).sort() as
  (keyof IsoDateTimeInternals)[]

export const isoDateFieldNames = isoDateInternalNames.slice(1) as
  (keyof IsoDateTimeFields)[]

export const isoTimeFieldNamesAsc = Object.keys(isoTimeFieldRefiners) as
  (keyof IsoTimeFields)[]

export const isoTimeFieldNames = isoTimeFieldNamesAsc.sort()
export const isoDateTimeFieldNamesAsc = [...isoDateFieldNames, ...isoTimeFieldNamesAsc]

// Defaults
// -------------------------------------------------------------------------------------------------

export const isoTimeFieldDefaults = mapPropNamesToConstant(isoTimeFieldNames, 0)

// Conversion
// -------------------------------------------------------------------------------------------------

export const pluckIsoDateInternals: (internals: IsoDateInternals) => IsoDateFields =
  (pluckProps as any).bind(undefined, isoDateInternalNames)

export const pluckIsoDateTimeInternals: (internals: IsoDateTimeInternals) => IsoDateTimeInternals =
  (pluckProps as any).bind(undefined, isoDateTimeInternalNames)

export const pluckIsoDateTimeFields: (fields: IsoDateTimeFields) => IsoDateTimeFields =
  (pluckProps as any).bind(undefined, isoDateTimeFieldNamesAsc)

export const pluckIsoTimeFields: (fields: IsoTimeFields) => IsoTimeFields =
  (pluckProps as any).bind(undefined, isoTimeFieldNames)

function generatePublicIsoFields<I extends { calendar: CalendarOps }>(
  pluckFunc: (internals: I) => I,
  internals: I,
): I & { calendar: CalendarIdOrObj } {
  const publicFields = pluckFunc(internals) as (I & { calendar: CalendarIdOrObj })
  publicFields.calendar = getPublicIdOrObj(internals.calendar)
  return publicFields
}

export const generatePublicIsoDateFields: (
  isoDateFields: IsoDateFields
) => (
  IsoDateFields & { calendar: CalendarIdOrObj }
) = (generatePublicIsoFields as any).bind(undefined, pluckIsoDateInternals)

export const generatePublicIsoDateTimeFields: (
  isoDateTimeFields: IsoDateTimeFields
) => (
  IsoDateTimeFields & { calendar: CalendarIdOrObj }
) = (generatePublicIsoFields as any).bind(undefined, pluckIsoDateTimeInternals)

/*
Similar to getPublicCalendar and getPublicTimeZone
*/
export function getPublicIdOrObj(
  ops: { id: string },
): { id: string } | any {
  return getInternals(ops) || // adapter (return internal object)
    ops.id // impl (return id)
}
