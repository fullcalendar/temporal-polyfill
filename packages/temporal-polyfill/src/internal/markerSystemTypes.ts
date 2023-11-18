import { DayTimeNano } from './dayTimeNano'
import { DurationFields, DurationInternals } from './durationFields'
import { Unit } from './units'

export type MarkerToEpochNano<M> = (marker: M) => DayTimeNano
export type MoveMarker<M> = (marker: M, durationFields: DurationFields) => M
export type DiffMarkers<M> = (marker0: M, marker1: M, largeUnit: Unit) => DurationInternals
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
