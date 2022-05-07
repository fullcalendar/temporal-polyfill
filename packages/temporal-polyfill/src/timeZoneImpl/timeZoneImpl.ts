import { BigNano } from '../utils/nanoWrap'

export type RawTransition = [
  BigNano, // epochNano
  number, // offsetNanoBefore
  number, // offsetNanoAfter
]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneNano: BigNano): number[] // offsetNanos
  abstract getOffset(epochNano: BigNano): number // offsetNano
  abstract getTransition(epochNano: BigNano, direction: -1 | 1): RawTransition | undefined
}
