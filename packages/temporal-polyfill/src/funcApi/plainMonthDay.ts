import * as Native from './native/plainMonthDay'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/plainMonthDay'

export const create = Temporal ? Native.create : Shim.create
export const fromFields = Temporal ? Native.fromFields : Shim.fromFields
export const fromString = Temporal ? Native.fromString : Shim.fromString
export const withFields = Temporal ? Native.withFields : Shim.withFields
export const equals = Temporal ? Native.equals : Shim.equals
export const toPlainDate = Temporal ? Native.toPlainDate : Shim.toPlainDate
export const createFormat = Temporal ? Native.createFormat : Shim.createFormat
export const toLocaleString = Temporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = Temporal ? Native.toString : Shim.toString
