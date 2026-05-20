import * as Native from './native/plainDate'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/plainDate'

export const create = Temporal ? Native.create : Shim.create
export const fromFields = Temporal ? Native.fromFields : Shim.fromFields
export const fromString = Temporal ? Native.fromString : Shim.fromString
export const dayOfWeek = Temporal ? Native.dayOfWeek : Shim.dayOfWeek
export const daysInWeek = Temporal ? Native.daysInWeek : Shim.daysInWeek
export const weekOfYear = Temporal ? Native.weekOfYear : Shim.weekOfYear
export const yearOfWeek = Temporal ? Native.yearOfWeek : Shim.yearOfWeek
export const dayOfYear = Temporal ? Native.dayOfYear : Shim.dayOfYear
export const daysInMonth = Temporal ? Native.daysInMonth : Shim.daysInMonth
export const daysInYear = Temporal ? Native.daysInYear : Shim.daysInYear
export const monthsInYear = Temporal ? Native.monthsInYear : Shim.monthsInYear
export const inLeapYear = Temporal ? Native.inLeapYear : Shim.inLeapYear
export const withFields = Temporal ? Native.withFields : Shim.withFields
export const withCalendar = Temporal ? Native.withCalendar : Shim.withCalendar
export const add = Temporal ? Native.add : Shim.add
export const subtract = Temporal ? Native.subtract : Shim.subtract
export const diff = Temporal ? Native.diff : Shim.diff
export const equals = Temporal ? Native.equals : Shim.equals
export const compare = Temporal ? Native.compare : Shim.compare
export const toZonedDateTime = Temporal
  ? Native.toZonedDateTime
  : Shim.toZonedDateTime
export const toPlainDateTime = Temporal
  ? Native.toPlainDateTime
  : Shim.toPlainDateTime
export const toPlainYearMonth = Temporal
  ? Native.toPlainYearMonth
  : Shim.toPlainYearMonth
export const toPlainMonthDay = Temporal
  ? Native.toPlainMonthDay
  : Shim.toPlainMonthDay
export const createFormat = Temporal ? Native.createFormat : Shim.createFormat
export const toLocaleString = Temporal
  ? Native.toLocaleString
  : Shim.toLocaleString
export const toString = Temporal ? Native.toString : Shim.toString
export const withDayOfYear = Temporal
  ? Native.withDayOfYear
  : Shim.withDayOfYear
export const withDayOfMonth = Temporal
  ? Native.withDayOfMonth
  : Shim.withDayOfMonth
export const withDayOfWeek = Temporal
  ? Native.withDayOfWeek
  : Shim.withDayOfWeek
export const withWeekOfYear = Temporal
  ? Native.withWeekOfYear
  : Shim.withWeekOfYear
export const addYears = Temporal ? Native.addYears : Shim.addYears
export const addMonths = Temporal ? Native.addMonths : Shim.addMonths
export const addWeeks = Temporal ? Native.addWeeks : Shim.addWeeks
export const addDays = Temporal ? Native.addDays : Shim.addDays
export const subtractYears = Temporal
  ? Native.subtractYears
  : Shim.subtractYears
export const subtractMonths = Temporal
  ? Native.subtractMonths
  : Shim.subtractMonths
export const subtractWeeks = Temporal
  ? Native.subtractWeeks
  : Shim.subtractWeeks
export const subtractDays = Temporal ? Native.subtractDays : Shim.subtractDays
export const roundToYear = Temporal ? Native.roundToYear : Shim.roundToYear
export const roundToMonth = Temporal ? Native.roundToMonth : Shim.roundToMonth
export const roundToWeek = Temporal ? Native.roundToWeek : Shim.roundToWeek
export const startOfYear = Temporal ? Native.startOfYear : Shim.startOfYear
export const startOfMonth = Temporal ? Native.startOfMonth : Shim.startOfMonth
export const startOfWeek = Temporal ? Native.startOfWeek : Shim.startOfWeek
export const endOfYear = Temporal ? Native.endOfYear : Shim.endOfYear
export const endOfMonth = Temporal ? Native.endOfMonth : Shim.endOfMonth
export const endOfWeek = Temporal ? Native.endOfWeek : Shim.endOfWeek
export const diffYears = Temporal ? Native.diffYears : Shim.diffYears
export const diffMonths = Temporal ? Native.diffMonths : Shim.diffMonths
export const diffWeeks = Temporal ? Native.diffWeeks : Shim.diffWeeks
export const diffDays = Temporal ? Native.diffDays : Shim.diffDays
