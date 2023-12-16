import { DayTimeNano } from './dayTimeNano'
import { DurationFields } from './durationFields'
import { IsoDateFields } from './calendarIsoFields'
import { Unit } from './units'

export type MarkerSlots<C, T> =
  { epochNanoseconds: DayTimeNano, timeZone: T, calendar: C } |
  (IsoDateFields & { calendar: C })

export type MarkerToEpochNano<M> = (marker: M) => DayTimeNano
export type MoveMarker<M> = (marker: M, durationFields: DurationFields) => M
export type DiffMarkers<M> = (marker0: M, marker1: M, largeUnit: Unit) => DurationFields
export type MarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>,
  DiffMarkers<M>
]
export type SimpleMarkerSystem<M> = [
  M,
  MarkerToEpochNano<M>,
  MoveMarker<M>
]
