import { DayTimeNano } from './dayTimeNano'
import { IsoDateTimeFields } from './isoFields'

// TODO: do high-order types

export type TimeZoneGetOffsetNanosecondsForFunc = (
  epochNano: DayTimeNano,
) => number

export type TimeZoneGetPossibleInstantsForFunc = (
  isoFields: IsoDateTimeFields,
) => DayTimeNano[]
