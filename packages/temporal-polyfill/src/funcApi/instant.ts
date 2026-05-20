import * as Native from './native/instant'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/instant'

export const create = Temporal ? Native.create : Shim.create
export const isRecord = Temporal ? Native.isRecord : Shim.isRecord
export const fromEpochMilliseconds = Temporal
  ? Native.fromEpochMilliseconds
  : Shim.fromEpochMilliseconds
export const fromEpochNanoseconds = Temporal
  ? Native.fromEpochNanoseconds
  : Shim.fromEpochNanoseconds
export const fromString = Temporal ? Native.fromString : Shim.fromString
export const add = Temporal ? Native.add : Shim.add
export const subtract = Temporal ? Native.subtract : Shim.subtract
export const diff = Temporal ? Native.diff : Shim.diff
export const round = Temporal ? Native.round : Shim.round
export const equals = Temporal ? Native.equals : Shim.equals
export const compare = Temporal ? Native.compare : Shim.compare
export const toZonedDateTimeISO = Temporal
  ? Native.toZonedDateTimeISO
  : Shim.toZonedDateTimeISO
export const createFormat = Temporal ? Native.createFormat : Shim.createFormat
export const toLocaleString = Temporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = Temporal ? Native.toString : Shim.toString
