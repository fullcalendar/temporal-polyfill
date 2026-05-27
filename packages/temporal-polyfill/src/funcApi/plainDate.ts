import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/plainDate'
import * as Shim from './shim/plainDate'
import { getPlainDateRecordIfPresent } from './temporalRecords'

export const create = NativeTemporal ? Native.create : Shim.create
export function isRecord(
  arg: unknown,
): arg is Native.PlainDateNativeRecord | Shim.PlainDateShimRecord {
  return !!getPlainDateRecordIfPresent(arg)
}
export const fromFields = NativeTemporal ? Native.fromFields : Shim.fromFields
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const dayOfWeek = NativeTemporal ? Native.dayOfWeek : Shim.dayOfWeek
export const daysInWeek = NativeTemporal ? Native.daysInWeek : Shim.daysInWeek
export const weekOfYear = NativeTemporal ? Native.weekOfYear : Shim.weekOfYear
export const yearOfWeek = NativeTemporal ? Native.yearOfWeek : Shim.yearOfWeek
export const dayOfYear = NativeTemporal ? Native.dayOfYear : Shim.dayOfYear
export const daysInMonth = NativeTemporal
  ? Native.daysInMonth
  : Shim.daysInMonth
export const daysInYear = NativeTemporal ? Native.daysInYear : Shim.daysInYear
export const monthsInYear = NativeTemporal
  ? Native.monthsInYear
  : Shim.monthsInYear
export const inLeapYear = NativeTemporal ? Native.inLeapYear : Shim.inLeapYear
export const withFields = NativeTemporal ? Native.withFields : Shim.withFields
export const withCalendar = NativeTemporal
  ? Native.withCalendar
  : Shim.withCalendar
export const add = NativeTemporal ? Native.add : Shim.add
export const subtract = NativeTemporal ? Native.subtract : Shim.subtract
export const diff = NativeTemporal ? Native.diff : Shim.diff
export const equals = NativeTemporal ? Native.equals : Shim.equals
export const compare = NativeTemporal ? Native.compare : Shim.compare
export const toZonedDateTime = NativeTemporal
  ? Native.toZonedDateTime
  : Shim.toZonedDateTime
export const toPlainDateTime = NativeTemporal
  ? Native.toPlainDateTime
  : Shim.toPlainDateTime
export const toPlainYearMonth = NativeTemporal
  ? Native.toPlainYearMonth
  : Shim.toPlainYearMonth
export const toPlainMonthDay = NativeTemporal
  ? Native.toPlainMonthDay
  : Shim.toPlainMonthDay
export const createFormat = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat
export const toLocaleString = NativeTemporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = NativeTemporal ? Native.toString : Shim.toString
export const withDayOfYear = NativeTemporal
  ? Native.withDayOfYear
  : Shim.withDayOfYear
export const withDayOfMonth = NativeTemporal
  ? Native.withDayOfMonth
  : Shim.withDayOfMonth
export const withDayOfWeek = NativeTemporal
  ? Native.withDayOfWeek
  : Shim.withDayOfWeek
export const withWeekOfYear = NativeTemporal
  ? Native.withWeekOfYear
  : Shim.withWeekOfYear
export const addYears = NativeTemporal ? Native.addYears : Shim.addYears
export const addMonths = NativeTemporal ? Native.addMonths : Shim.addMonths
export const addWeeks = NativeTemporal ? Native.addWeeks : Shim.addWeeks
export const addDays = NativeTemporal ? Native.addDays : Shim.addDays
export const subtractYears = NativeTemporal
  ? Native.subtractYears
  : Shim.subtractYears
export const subtractMonths = NativeTemporal
  ? Native.subtractMonths
  : Shim.subtractMonths
export const subtractWeeks = NativeTemporal
  ? Native.subtractWeeks
  : Shim.subtractWeeks
export const subtractDays = NativeTemporal
  ? Native.subtractDays
  : Shim.subtractDays
export const roundToYear = NativeTemporal
  ? Native.roundToYear
  : Shim.roundToYear
export const roundToMonth = NativeTemporal
  ? Native.roundToMonth
  : Shim.roundToMonth
export const roundToWeek = NativeTemporal
  ? Native.roundToWeek
  : Shim.roundToWeek
export const startOfYear = NativeTemporal
  ? Native.startOfYear
  : Shim.startOfYear
export const startOfMonth = NativeTemporal
  ? Native.startOfMonth
  : Shim.startOfMonth
export const startOfWeek = NativeTemporal
  ? Native.startOfWeek
  : Shim.startOfWeek
export const endOfYear = NativeTemporal ? Native.endOfYear : Shim.endOfYear
export const endOfMonth = NativeTemporal ? Native.endOfMonth : Shim.endOfMonth
export const endOfWeek = NativeTemporal ? Native.endOfWeek : Shim.endOfWeek
export const diffYears = NativeTemporal ? Native.diffYears : Shim.diffYears
export const diffMonths = NativeTemporal ? Native.diffMonths : Shim.diffMonths
export const diffWeeks = NativeTemporal ? Native.diffWeeks : Shim.diffWeeks
export const diffDays = NativeTemporal ? Native.diffDays : Shim.diffDays
