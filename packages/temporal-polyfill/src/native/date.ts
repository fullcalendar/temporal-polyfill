import { Temporal } from 'temporal-spec'
import { Instant } from '../public/instant'

// types

export interface DateTemporalMethods {
  toTemporalInstant(): Instant
}

export type DateWithTemporal = Date & DateTemporalMethods

// implementation

export function toTemporalInstant(this: Date): Temporal.Instant {
  return Instant.fromEpochMilliseconds(this.valueOf())
}
