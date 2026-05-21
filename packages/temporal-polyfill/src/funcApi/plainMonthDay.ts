import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/plainMonthDay'
import * as Shim from './shim/plainMonthDay'

export const create = NativeTemporal ? Native.create : Shim.create
export const isRecord = NativeTemporal ? Native.isRecord : Shim.isRecord
export const fromFields = NativeTemporal ? Native.fromFields : Shim.fromFields
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const withFields = NativeTemporal ? Native.withFields : Shim.withFields
export const equals = NativeTemporal ? Native.equals : Shim.equals
export const toPlainDate = NativeTemporal
  ? Native.toPlainDate
  : Shim.toPlainDate
export const createFormat = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat
export const toLocaleString = NativeTemporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = NativeTemporal ? Native.toString : Shim.toString
