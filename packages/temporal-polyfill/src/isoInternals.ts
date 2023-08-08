import { CalendarProtocol } from './calendar'
import { CalendarOps, queryCalendarOps } from './calendarOps'
import { getInternals } from './class'
import { BoundArg, pluckProps } from './utils'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateFieldRefiners,
  isoTimeFieldRefiners,
} from './isoFields'

export interface CalendarInternals {
  calendar: CalendarOps
}

export type IsoDateInternals = IsoDateFields & CalendarInternals
export type IsoDateTimeInternals = IsoDateInternals & IsoTimeFields

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered alphabetically
export const isoDateInternalRefiners = {
  calendar: queryCalendarOps,
  ...isoDateFieldRefiners,
}

// Unordered
export const isoDateTimeInternalRefiners = {
  ...isoDateInternalRefiners,
  ...isoTimeFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

export const isoDateInternalNames = Object.keys(isoDateInternalRefiners) as
  (keyof IsoDateInternals)[]

export const isoDateTimeInternalNames = Object.keys(isoDateTimeInternalRefiners).sort() as
  (keyof IsoDateTimeInternals)[]

// Conversion
// -------------------------------------------------------------------------------------------------

export const pluckIsoDateInternals = pluckProps.bind<
  undefined, [BoundArg],
  [IsoDateInternals],
  IsoDateInternals // return
>(undefined, isoDateInternalNames) // bound

export const pluckIsoDateTimeInternals = pluckProps.bind<
  undefined, [BoundArg],
  [IsoDateTimeInternals],
  IsoDateTimeInternals // return
>(undefined, isoDateTimeInternalNames)
function generatePublicIsoFields<P>(
  pluckFunc: (internals: P) => P,
  internals: P & { calendar: CalendarOps }
): P & { calendar: CalendarPublic } {
  const publicFields = pluckFunc(internals) as P & { calendar: CalendarPublic }
  publicFields.calendar = getPublicIdOrObj(internals.calendar) as CalendarPublic
  return publicFields
}

// Public
// -------------------------------------------------------------------------------------------------
// TODO: move?

// TODO: make DRY with CalendarArg (it's a subset)
export type CalendarPublic = CalendarProtocol | string

export type IsoDatePublic = IsoDateFields & { calendar: CalendarPublic }
export type IsoDateTimePublic = IsoDateTimeFields & { calendar: CalendarPublic }

export const generatePublicIsoDateFields = generatePublicIsoFields.bind<
  undefined, [BoundArg],
  [IsoDateInternals],
  IsoDatePublic // return
>(undefined, pluckIsoDateInternals)

export const generatePublicIsoDateTimeFields = generatePublicIsoFields.bind<
  undefined, [BoundArg],
  [IsoDateTimeInternals],
  IsoDateTimePublic // return
>(undefined, pluckIsoDateTimeInternals)
/*
Similar to getPublicCalendar and getPublicTimeZone
*/

export function getPublicIdOrObj(
  ops: { id: string }
): unknown {
  return getInternals(ops) || // adapter (return internal object)
    ops.id // impl (return id)
}
