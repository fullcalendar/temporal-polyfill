import { DayTimeNano } from './dayTimeNano'
import { IsoDateTimeFields } from './isoFields'

export type OffsetNanosecondsOp = (epochNano: DayTimeNano) => number
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => DayTimeNano[]

export type TimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp,
  getPossibleInstantsFor: PossibleInstantsOp,
}

export type SimpleTimeZoneOps = {
  getOffsetNanosecondsFor: OffsetNanosecondsOp,
}
