import { DayTimeNano } from './dayTimeNano'
import { IsoDateTimeFields } from './isoFields'

export type TimeZoneGetOffsetNanosecondsForFunc = (
  epochNano: DayTimeNano,
) => number

export type TimeZoneGetPossibleInstantsForFunc = (
  isoFields: IsoDateTimeFields,
) => DayTimeNano[]
