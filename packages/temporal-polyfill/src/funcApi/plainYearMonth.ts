import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/plainYearMonth'
import * as Shim from './shim/plainYearMonth'

export const create = NativeTemporal ? Native.create : Shim.create
export const isRecord = NativeTemporal ? Native.isRecord : Shim.isRecord
export const fromFields = NativeTemporal ? Native.fromFields : Shim.fromFields
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const daysInMonth = NativeTemporal
  ? Native.daysInMonth
  : Shim.daysInMonth
export const daysInYear = NativeTemporal ? Native.daysInYear : Shim.daysInYear
export const monthsInYear = NativeTemporal
  ? Native.monthsInYear
  : Shim.monthsInYear
export const inLeapYear = NativeTemporal ? Native.inLeapYear : Shim.inLeapYear
export const withFields = NativeTemporal ? Native.withFields : Shim.withFields
export const add = NativeTemporal ? Native.add : Shim.add
export const subtract = NativeTemporal ? Native.subtract : Shim.subtract
export const diff = NativeTemporal ? Native.diff : Shim.diff
export const equals = NativeTemporal ? Native.equals : Shim.equals
export const compare = NativeTemporal ? Native.compare : Shim.compare
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
