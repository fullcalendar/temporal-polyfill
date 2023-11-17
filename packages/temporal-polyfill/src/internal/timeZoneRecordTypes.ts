import { DayTimeNano } from './dayTimeNano'
import { IsoDateTimeSlots } from './slots'

export type TimeZoneGetOffsetNanosecondsForFunc = (
  epochNano: DayTimeNano,
) => number

export type TimeZoneGetPossibleInstantsForFunc = (
  isoDateTimeSlots: IsoDateTimeSlots, // needs calendar i think
) => DayTimeNano[]
