import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/duration'
import * as Shim from './shim/duration'
import { getDurationRecordIfPresent } from './temporalRecords'

export const create = NativeTemporal ? Native.create : Shim.create
export function isRecord(
  arg: unknown,
): arg is Native.DurationNativeRecord | Shim.DurationShimRecord {
  return !!getDurationRecordIfPresent(arg)
}
export const fromFields = NativeTemporal ? Native.fromFields : Shim.fromFields
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const sign = NativeTemporal ? Native.sign : Shim.sign
export const blank = NativeTemporal ? Native.blank : Shim.blank
export const withFields = NativeTemporal ? Native.withFields : Shim.withFields
export const negated = NativeTemporal ? Native.negated : Shim.negated
export const abs = NativeTemporal ? Native.abs : Shim.abs
export const add = NativeTemporal ? Native.add : Shim.add
export const subtract = NativeTemporal ? Native.subtract : Shim.subtract
export const round = NativeTemporal ? Native.round : Shim.round
export const total = NativeTemporal ? Native.total : Shim.total
export const compare = NativeTemporal ? Native.compare : Shim.compare
export const toLocaleString = NativeTemporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = NativeTemporal ? Native.toString : Shim.toString
