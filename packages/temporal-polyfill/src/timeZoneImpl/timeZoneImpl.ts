import { LargeInt } from '../utils/largeInt'

export type RawTransition = [
  LargeInt, // epochNano
  number, // offsetNanoBefore
  number, // offsetNanoAfter
]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneNano: LargeInt): number[] // offsetNanos
  abstract getOffset(epochNano: LargeInt): number // offsetNano
  abstract getTransition(epochNano: LargeInt, direction: -1 | 1): RawTransition | undefined
}
