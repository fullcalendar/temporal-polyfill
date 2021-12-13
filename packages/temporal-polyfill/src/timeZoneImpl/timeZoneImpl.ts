
// [epochSecs, offsetSecsBefore, offsetSecsAfter]
export type RawTransition = [number, number, number]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneSecs: number): number[]
  abstract getOffset(epochSecs: number): number
  abstract getTransition(epochSecs: number, direction: -1 | 1): RawTransition | undefined
}
