import { Instant } from '../public/instant'

// types

export interface DateTemporalMethods {
  toTemporalInstant(): Instant
}

export type DateWithTemporal = Date & DateTemporalMethods

// implementation

export function toTemporalInstant(this: Date): Instant {
  return Instant.fromEpochMilliseconds(this.valueOf())
}
