import { computeIsoDaysInMonth, computeIsoMonthsInYear } from './calendarIso'
import { Overflow } from './options'
import { clampProp, isClamped } from './utils'
import { IsoTimeFields, IsoDateTimeFields, IsoDateFields } from './calendarIsoFields'
import { checkIsoDateInBounds, checkIsoDateTimeInBounds } from './epochAndTime'
import { toInteger } from './cast'

// TODO: change name of this file

export function constrainIsoTimeFields(isoTimeFields: IsoTimeFields, overflow: Overflow | undefined): IsoTimeFields {
  // TODO: clever way to compress this, using functional programming
  // Will this kill need for clampProp?
  return {
    isoHour: clampProp(isoTimeFields, 'isoHour', 0, 23, overflow),
    isoMinute: clampProp(isoTimeFields, 'isoMinute', 0, 59, overflow),
    isoSecond: clampProp(isoTimeFields, 'isoSecond', 0, 59, overflow),
    isoMillisecond: clampProp(isoTimeFields, 'isoMillisecond', 0, 999, overflow),
    isoMicrosecond: clampProp(isoTimeFields, 'isoMicrosecond', 0, 999, overflow),
    isoNanosecond: clampProp(isoTimeFields, 'isoNanosecond', 0, 999, overflow),
  }
}

export function constrainIsoDateTimeLike<P extends IsoDateTimeFields>(isoDateTimeFields: P): P {
  return {
    ...constrainIsoDateLike(isoDateTimeFields),
    ...constrainIsoTimeFields(isoDateTimeFields, Overflow.Reject),
  }
}

// TODO: remove `extends`
export function constrainIsoDateLike<P extends IsoDateFields>(isoInternals: P): P {
  if (!isIsoDateFieldsValid(isoInternals)) {
    // TODO: more DRY error
    throw new RangeError('Invalid iso date')
  }
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: IsoDateFields): boolean {
  const { isoYear, isoMonth, isoDay } = isoFields

  return isClamped(isoMonth, 1, computeIsoMonthsInYear(isoYear)) && // TODO: use just 12
    isClamped(isoDay, 1, computeIsoDaysInMonth(isoYear, isoMonth))
}

// -------------------------------------------------------------------------------------------------

export function refineIsoDateArgs(isoYear: number, isoMonth: number, isoDay: number): IsoDateFields {
  return checkIsoDateInBounds(
    constrainIsoDateLike({
      isoYear: toInteger(isoYear),
      isoMonth: toInteger(isoMonth),
      isoDay: toInteger(isoDay),
    })
  )
}

export function refineIsoDateTimeArgs(
  isoYear: number, isoMonth: number, isoDay: number,
  isoHour: number, isoMinute: number, isoSecond: number,
  isoMillisecond: number, isoMicrosecond: number, isoNanosecond: number,
): IsoDateTimeFields {
  return checkIsoDateTimeInBounds(
    constrainIsoDateTimeLike({
      isoYear: toInteger(isoYear),
      isoMonth: toInteger(isoMonth),
      isoDay: toInteger(isoDay),
      isoHour: toInteger(isoHour),
      isoMinute: toInteger(isoMinute),
      isoSecond: toInteger(isoSecond),
      isoMillisecond: toInteger(isoMillisecond),
      isoMicrosecond: toInteger(isoMicrosecond),
      isoNanosecond: toInteger(isoNanosecond),
    })
  )
}
