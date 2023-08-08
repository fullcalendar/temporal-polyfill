import { CalendarArg, CalendarProtocol } from './calendar'
import { queryCalendarOps } from './calendarOpsQuery'
import { CalendarOps } from './calendarOps'
import { getInternals } from './class'
import { BoundArg, clampProp, mapPropsWithRefiners, pluckProps } from './utils'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  constrainIsoTimeFields,
  isoDateFieldRefiners,
  isoTimeFieldRefiners,
} from './isoFields'
import { checkIsoInBounds, computeIsoDaysInMonth, isoMonthsInYear } from './isoMath'
import { Overflow } from './options'

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

// Advanced Refining
// -------------------------------------------------------------------------------------------------

export function refineIsoDateTimeInternals(
  rawIsoDateTimeInternals: IsoDateTimeFields & { calendar: CalendarArg },
): IsoDateTimeInternals {
  return checkIsoInBounds(
    constrainIsoDateTimeInternals(
      mapPropsWithRefiners(rawIsoDateTimeInternals, isoDateTimeInternalRefiners),
    ),
  )
}

export function refineIsoDateInternals(
  rawIsoDateInternals: IsoDateFields & { calendar: CalendarArg },
): IsoDateInternals {
  return checkIsoInBounds(
    constrainIsoDateInternals(
      mapPropsWithRefiners(rawIsoDateInternals, isoDateInternalRefiners),
    ),
  )
}

// Constraining
// -------------------------------------------------------------------------------------------------

export function constrainIsoDateTimeInternals(
  isoDateTimeFields: IsoDateTimeInternals,
): IsoDateTimeInternals {
  return {
    ...constrainIsoDateInternals(isoDateTimeFields),
    ...constrainIsoTimeFields(isoDateTimeFields),
  }
}

/*
accepts iso-date-like fields and will pass all through
*/
export function constrainIsoDateInternals<P extends IsoDateFields>(
  isoInternals: P,
  overflow?: Overflow,
): P
export function constrainIsoDateInternals<P extends IsoDateFields>(
  isoInternals: P,
  overflow: Overflow | -1,
): P | undefined
export function constrainIsoDateInternals<P extends IsoDateFields>(
  isoInternals: P,
  overflow: Overflow | -1 = Overflow.Reject,
): P | undefined {
  const isoMonth = clampProp(
    isoInternals as IsoDateFields,
    'isoMonth',
    1,
    isoMonthsInYear,
    overflow,
  )

  if (isoMonth) {
    const daysInMonth = computeIsoDaysInMonth(isoInternals.isoYear, isoMonth)
    const isoDay = clampProp(isoInternals as IsoDateFields, 'isoDay', 1, daysInMonth, overflow)

    if (isoDay) {
      return {
        ...isoInternals,
        isoMonth,
        isoDay,
      }
    }
  }
}
