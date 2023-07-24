import { CalendarOps, queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import { toInteger } from './options'
import { mapPropNamesToConstant, pluckProps, pluckPropsTuple } from './utils'

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

// TODO: move
type CalendarPublic = CalendarProtocol | string

export interface CalendarInternals {
  calendar: CalendarOps
}

export type IsoDateInternals = IsoDateFields & CalendarInternals
export type IsoDateTimeFields = IsoDateFields & IsoTimeFields
export type IsoDateTimeInternals = IsoDateInternals & IsoTimeFields

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

export const pluckIsoDateInternals = pluckProps.bind<
  any, [any], // bound
  [IsoDateInternals], // unbound
  IsoDateInternals // return
>(undefined, isoDateInternalNames) // bound

export const pluckIsoDateTimeInternals = pluckProps.bind<
  any, [any], // bound
  [IsoDateTimeInternals], // unbound
  IsoDateTimeInternals // return
>(undefined, isoDateTimeInternalNames)

export const pluckIsoTimeFields = pluckProps.bind<
  any, [any], // bound
  [IsoTimeFields], // unbound
  IsoTimeFields // return
>(undefined, isoTimeFieldNames)

// TODO: move?
export type IsoTuple = [
  isoYear: number,
  isoMonth?: number,
  isoDay?: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMilli?: number,
]

// TODO: move?
export const pluckIsoTuple = pluckPropsTuple.bind<
  any, [any],
  [Partial<IsoDateTimeFields> & { isoYear: number }], // unbound
  IsoTuple // return
>(undefined, isoDateTimeFieldNamesAsc.reverse())

function generatePublicIsoFields<P>(
  pluckFunc: (internals: P) => P,
  internals: P & { calendar: CalendarOps },
): P & { calendar: CalendarPublic } {
  const publicFields = pluckFunc(internals) as P & { calendar: CalendarPublic }
  publicFields.calendar = getPublicIdOrObj(internals.calendar)
  return publicFields
}

export type IsoDatePublic = IsoDateFields & { calendar: CalendarPublic }
export type IsoDateTimePublic = IsoDateTimeFields & { calendar: CalendarPublic }

export const generatePublicIsoDateFields = generatePublicIsoFields.bind<
  any, [any], // bound
  [IsoDateInternals], // unbound
  IsoDatePublic // return
>(undefined, pluckIsoDateInternals)

export const generatePublicIsoDateTimeFields = generatePublicIsoFields.bind<
  any, [any], // bound
  [IsoDateTimeInternals], // unbound
  IsoDateTimePublic // return
>(undefined, pluckIsoDateTimeInternals)

/*
Similar to getPublicCalendar and getPublicTimeZone
*/
export function getPublicIdOrObj(
  ops: { id: string },
): { id: string } | any {
  return getInternals(ops) || // adapter (return internal object)
    ops.id // impl (return id)
}
