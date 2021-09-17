import { Instant } from '../public/instant'

// types

export interface DateTemporalMethods {
  toTemporalInstant(): Instant
}

export type DateWithTemporal = Date & DateTemporalMethods

// implementation

export function dateToTemporalInstant(date: Date): Instant {
  return Instant.fromEpochMilliseconds(date.valueOf())
}
