import { NanoWrap } from '../utils/nanoWrap'

export type RawTransition = [
  NanoWrap, // epochNano
  number, // offsetNanoBefore
  number, // offsetNanoAfter
]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneNano: NanoWrap): number[] // offsetNanos
  abstract getOffset(epochNano: NanoWrap): number // offsetNano
  abstract getTransition(epochNano: NanoWrap, direction: -1 | 1): RawTransition | undefined
}
