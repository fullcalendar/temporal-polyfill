
// [offsetMinsBase, offsetMinsDiff]
// If there are two possible offsets,
//   first is offsetMinsBase, second is offsetMinsBase + offsetMinsDiff
// If there is only one,
//   offsetMinsDiff will be zero, and the only offset will be offsetMinsBase
export type PossibleOffsetInfo = [number, number]

// [epochMins, offsetMinsBase, offsetMinsDiff]
export type RawTransition = [number, number, number]

export abstract class TimeZoneImpl {
  constructor(public id: string) {}

  abstract getPossibleOffsets(zoneMinutes: number): PossibleOffsetInfo
  abstract getOffset(epochMinutes: number): number
  abstract getTransition(epochMinutes: number, direction: -1 | 1): RawTransition | undefined
}
