import { CalendarArg, CalendarProtocol } from './calendar'
import { queryCalendarOps } from './calendarOpsQuery'
import { CalendarOps } from './calendarOps'
import { BoundArg, isClamped, mapPropsWithRefiners, pluckProps } from './utils'
import {
  IsoDateFields,
  IsoDateTimeFields,
  constrainIsoTimeFields,
  isoDateFieldRefiners,
  isoTimeFieldRefiners,
} from './isoFields'
import { checkIsoDateInBounds, checkIsoDateTimeInBounds, checkIsoYearMonthInBounds, computeIsoDaysInMonth, computeIsoMonthsInYear } from './isoMath'
import { Overflow } from './options'
import { IsoDateSlots, IsoDateTimeSlots } from './slots'

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
  (keyof IsoDateSlots)[]

export const isoDateTimeInternalNames = Object.keys(isoDateTimeInternalRefiners).sort() as
  (keyof IsoDateTimeSlots)[]

// Conversion
// -------------------------------------------------------------------------------------------------

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
  [IsoDateSlots],
  IsoDatePublic // return
>(undefined, pluckIsoDateInternals)

export const generatePublicIsoDateTimeFields = generatePublicIsoFields.bind<
  undefined, [BoundArg],
  [IsoDateTimeSlots],
  IsoDateTimePublic // return
>(undefined, pluckIsoDateTimeInternals)


// Similar to getPublicCalendar and getPublicTimeZone
// HACKY!!!
export function getPublicIdOrObj(
  ops: { id: string }
): unknown {
  return (ops as any).c || // CalendarOpsAdapter
    (ops as any).t || // TimeZoneOpsAdapter
    ops.id // impl (return id)
}

// Advanced Refining
// -------------------------------------------------------------------------------------------------

export function refineIsoDateTimeInternals(
  rawIsoDateTimeInternals: IsoDateTimeFields & { calendar: CalendarArg },
): IsoDateTimeSlots {
  return checkIsoDateTimeInBounds(
    constrainIsoDateTimeInternals(
      mapPropsWithRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners),
    ),
  )
}

export function refineIsoDateInternals(
  rawIsoDateInternals: IsoDateFields & { calendar: CalendarArg },
): IsoDateSlots {
  return checkIsoDateInBounds(
    constrainIsoDateInternals(
      mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners),
    ),
  )
}

export function refineIsoYearMonthInternals(
  rawIsoDateInternals: IsoDateFields & { calendar: CalendarArg },
): IsoDateSlots {
  return checkIsoYearMonthInBounds(
    constrainIsoDateInternals(
      mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners),
    ),
  )
}

// Constraining
// -------------------------------------------------------------------------------------------------

/*
TODO: rename, because either passes or fails (does not clamp)
TODO: dont accept/return anything
*/
export function constrainIsoDateTimeInternals<P extends IsoDateTimeFields>(isoDateTimeFields: P): P {
  return {
    ...constrainIsoDateInternals(isoDateTimeFields),
    ...constrainIsoTimeFields(isoDateTimeFields, Overflow.Reject),
  }
}

/*
TODO: rename, because either passes or fails (does not clamp)
TODO: does this need to use 'internals'?
NOTE: accepts iso-date-like fields and will pass all through
TODO: dont accept/return anything
*/
export function constrainIsoDateInternals<P extends IsoDateFields>(isoInternals: P): P {
  if (!isIsoDateFieldsValid(isoInternals)) {
    // TODO: more DRY error
    throw new RangeError('Invalid iso date')
  }
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: IsoDateFields): boolean {
  const { isoYear, isoMonth, isoDay } = isoFields

  return isClamped(isoMonth, 1, computeIsoMonthsInYear(isoYear)) &&
    isClamped(isoDay, 1, computeIsoDaysInMonth(isoYear, isoMonth))
}
