import * as Native from './native/plainYearMonth'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/plainYearMonth'

export const create = Temporal ? Native.create : Shim.create
export const isRecord = Temporal ? Native.isRecord : Shim.isRecord
export const fromFields = Temporal ? Native.fromFields : Shim.fromFields
export const fromString = Temporal ? Native.fromString : Shim.fromString
export const daysInMonth = Temporal ? Native.daysInMonth : Shim.daysInMonth
export const daysInYear = Temporal ? Native.daysInYear : Shim.daysInYear
export const monthsInYear = Temporal ? Native.monthsInYear : Shim.monthsInYear
export const inLeapYear = Temporal ? Native.inLeapYear : Shim.inLeapYear
export const withFields = Temporal ? Native.withFields : Shim.withFields
export const add = Temporal ? Native.add : Shim.add
export const subtract = Temporal ? Native.subtract : Shim.subtract
export const diff = Temporal ? Native.diff : Shim.diff
export const equals = Temporal ? Native.equals : Shim.equals
export const compare = Temporal ? Native.compare : Shim.compare
export const toPlainDate = Temporal ? Native.toPlainDate : Shim.toPlainDate
export const createFormat = Temporal ? Native.createFormat : Shim.createFormat
export const toLocaleString = Temporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = Temporal ? Native.toString : Shim.toString
