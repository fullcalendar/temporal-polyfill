
export type RawTransition = [
  bigint, // epochNano
  number, // offsetNanoBefore
  number, // offsetNanoAfter
]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneNano: bigint): number[] // offsetNanos
  abstract getOffset(epochNano: bigint): number // offsetNano
  abstract getTransition(epochNano: bigint, direction: -1 | 1): RawTransition | undefined
}
