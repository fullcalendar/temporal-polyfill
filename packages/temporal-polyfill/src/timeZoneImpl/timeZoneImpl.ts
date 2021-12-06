
// [offsetSecsBase, offsetSecsDiff]
// If there are two possible offsets,
//   first is offsetSecsBase, second is offsetSecsBase + offsetSecsDiff
// If there is only one,
//   offsetSecsDiff will be zero, and the only offset will be offsetSecsBase
export type PossibleOffsetInfo = [number, number]

// [epochSecs, offsetSecsBase, offsetSecsDiff]
export type RawTransition = [number, number, number]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneSecs: number): PossibleOffsetInfo
  abstract getOffset(epochSecs: number): number
  abstract getTransition(epochSecs: number, direction: -1 | 1): RawTransition | undefined
}
