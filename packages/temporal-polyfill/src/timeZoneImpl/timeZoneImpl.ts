
// [offsetMinsBase, offsetMinsDiff]
// If there are two possible offsets,
//   first is offsetMinsBase, second is offsetMinsBase + offsetMinsDiff
// If there is only one,
//   offsetMinsDiff will be zero, and the only offset will be offsetMinsBase
export type PossibleOffsetInfo = [number, number]

// [epochMins, offsetMinsBase, offsetMinsDiff]
export type RawTransition = [number, number, number]

export interface TimeZoneImpl {
  getPossibleOffsets(zoneMinutes: number): PossibleOffsetInfo
  getOffset(epochMinutes: number): number
  getTransition(epochMinutes: number, direction: -1 | 1): RawTransition | undefined
}
