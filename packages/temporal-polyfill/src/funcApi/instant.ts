import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/instant'
import * as Shim from './shim/instant'
import { getInstantRecordIfPresent } from './temporalRecords'

export const create = NativeTemporal ? Native.create : Shim.create
export function isRecord(
  arg: unknown,
): arg is Native.InstantNativeRecord | Shim.InstantShimRecord {
  return !!getInstantRecordIfPresent(arg)
}
export const fromEpochMilliseconds = NativeTemporal
  ? Native.fromEpochMilliseconds
  : Shim.fromEpochMilliseconds
export const fromEpochNanoseconds = NativeTemporal
  ? Native.fromEpochNanoseconds
  : Shim.fromEpochNanoseconds
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const add = NativeTemporal ? Native.add : Shim.add
export const subtract = NativeTemporal ? Native.subtract : Shim.subtract
export const diff = NativeTemporal ? Native.diff : Shim.diff
export const round = NativeTemporal ? Native.round : Shim.round
export const equals = NativeTemporal ? Native.equals : Shim.equals
export const compare = NativeTemporal ? Native.compare : Shim.compare
export const toZonedDateTimeISO = NativeTemporal
  ? Native.toZonedDateTimeISO
  : Shim.toZonedDateTimeISO
export const createFormat = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat
export const toLocaleString = NativeTemporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = NativeTemporal ? Native.toString : Shim.toString
export const toSimpleString = NativeTemporal
  ? Native.toSimpleString
  : Shim.toSimpleString
