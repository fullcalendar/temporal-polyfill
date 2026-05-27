import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/plainTime'
import * as Shim from './shim/plainTime'
import { getPlainTimeRecordIfPresent } from './temporalRecords'

export const create = NativeTemporal ? Native.create : Shim.create
export function isRecord(
  arg: unknown,
): arg is Native.PlainTimeNativeRecord | Shim.PlainTimeShimRecord {
  return !!getPlainTimeRecordIfPresent(arg)
}
export const fromFields = NativeTemporal ? Native.fromFields : Shim.fromFields
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const withFields = NativeTemporal ? Native.withFields : Shim.withFields
export const add = NativeTemporal ? Native.add : Shim.add
export const subtract = NativeTemporal ? Native.subtract : Shim.subtract
export const diff = NativeTemporal ? Native.diff : Shim.diff
export const round = NativeTemporal ? Native.round : Shim.round
export const equals = NativeTemporal ? Native.equals : Shim.equals
export const compare = NativeTemporal ? Native.compare : Shim.compare
export const createFormat = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat
export const toLocaleString = NativeTemporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = NativeTemporal ? Native.toString : Shim.toString
