import * as Native from './native/zonedDateTime'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/zonedDateTime'

export const create = Temporal ? Native.create : Shim.create
export const isRecord = Temporal ? Native.isRecord : Shim.isRecord
export const fromFields = Temporal ? Native.fromFields : Shim.fromFields
export const fromString = Temporal ? Native.fromString : Shim.fromString
export const withFields = Temporal ? Native.withFields : Shim.withFields
export const withCalendar = Temporal ? Native.withCalendar : Shim.withCalendar
export const withTimeZone = Temporal ? Native.withTimeZone : Shim.withTimeZone
export const withPlainTime = Temporal
  ? Native.withPlainTime
  : Shim.withPlainTime
export const offsetNanoseconds = Temporal
  ? Native.offsetNanoseconds
  : Shim.offsetNanoseconds
export const offset = Temporal ? Native.offset : Shim.offset
export const dayOfWeek = Temporal ? Native.dayOfWeek : Shim.dayOfWeek
export const daysInWeek = Temporal ? Native.daysInWeek : Shim.daysInWeek
export const weekOfYear = Temporal ? Native.weekOfYear : Shim.weekOfYear
export const yearOfWeek = Temporal ? Native.yearOfWeek : Shim.yearOfWeek
export const dayOfYear = Temporal ? Native.dayOfYear : Shim.dayOfYear
export const daysInMonth = Temporal ? Native.daysInMonth : Shim.daysInMonth
export const daysInYear = Temporal ? Native.daysInYear : Shim.daysInYear
export const monthsInYear = Temporal ? Native.monthsInYear : Shim.monthsInYear
export const inLeapYear = Temporal ? Native.inLeapYear : Shim.inLeapYear
export const hoursInDay = Temporal ? Native.hoursInDay : Shim.hoursInDay
export const toString = Temporal ? Native.toString : Shim.toString
export const add = Temporal ? Native.add : Shim.add
export const subtract = Temporal ? Native.subtract : Shim.subtract
export const diff = Temporal ? Native.diff : Shim.diff
export const round = Temporal ? Native.round : Shim.round
export const startOfDay = Temporal ? Native.startOfDay : Shim.startOfDay
export const getTimeZoneTransition = Temporal
  ? Native.getTimeZoneTransition
  : Shim.getTimeZoneTransition
export const equals = Temporal ? Native.equals : Shim.equals
export const compare = Temporal ? Native.compare : Shim.compare
export const toInstant = Temporal ? Native.toInstant : Shim.toInstant
export const toPlainDateTime = Temporal
  ? Native.toPlainDateTime
  : Shim.toPlainDateTime
export const toPlainDate = Temporal ? Native.toPlainDate : Shim.toPlainDate
export const toPlainTime = Temporal ? Native.toPlainTime : Shim.toPlainTime
export const toLocaleString = Temporal
  ? Native.toLocaleString
  : Shim.toLocaleString
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
export const addHours = Temporal ? Native.addHours : Shim.addHours
export const addMinutes = Temporal ? Native.addMinutes : Shim.addMinutes
export const addSeconds = Temporal ? Native.addSeconds : Shim.addSeconds
export const addMilliseconds = Temporal
  ? Native.addMilliseconds
  : Shim.addMilliseconds
export const addMicroseconds = Temporal
  ? Native.addMicroseconds
  : Shim.addMicroseconds
export const addNanoseconds = Temporal
  ? Native.addNanoseconds
  : Shim.addNanoseconds
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
export const subtractHours = Temporal
  ? Native.subtractHours
  : Shim.subtractHours
export const subtractMinutes = Temporal
  ? Native.subtractMinutes
  : Shim.subtractMinutes
export const subtractSeconds = Temporal
  ? Native.subtractSeconds
  : Shim.subtractSeconds
export const subtractMilliseconds = Temporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds
export const subtractMicroseconds = Temporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds
export const subtractNanoseconds = Temporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds
export const roundToYear = Temporal ? Native.roundToYear : Shim.roundToYear
export const roundToMonth = Temporal ? Native.roundToMonth : Shim.roundToMonth
export const roundToWeek = Temporal ? Native.roundToWeek : Shim.roundToWeek
export const startOfYear = Temporal ? Native.startOfYear : Shim.startOfYear
export const startOfMonth = Temporal ? Native.startOfMonth : Shim.startOfMonth
export const startOfWeek = Temporal ? Native.startOfWeek : Shim.startOfWeek
export const startOfHour = Temporal ? Native.startOfHour : Shim.startOfHour
export const startOfMinute = Temporal
  ? Native.startOfMinute
  : Shim.startOfMinute
export const startOfSecond = Temporal
  ? Native.startOfSecond
  : Shim.startOfSecond
export const startOfMillisecond = Temporal
  ? Native.startOfMillisecond
  : Shim.startOfMillisecond
export const startOfMicrosecond = Temporal
  ? Native.startOfMicrosecond
  : Shim.startOfMicrosecond
export const endOfYear = Temporal ? Native.endOfYear : Shim.endOfYear
export const endOfMonth = Temporal ? Native.endOfMonth : Shim.endOfMonth
export const endOfWeek = Temporal ? Native.endOfWeek : Shim.endOfWeek
export const endOfDay = Temporal ? Native.endOfDay : Shim.endOfDay
export const endOfHour = Temporal ? Native.endOfHour : Shim.endOfHour
export const endOfMinute = Temporal ? Native.endOfMinute : Shim.endOfMinute
export const endOfSecond = Temporal ? Native.endOfSecond : Shim.endOfSecond
export const endOfMillisecond = Temporal
  ? Native.endOfMillisecond
  : Shim.endOfMillisecond
export const endOfMicrosecond = Temporal
  ? Native.endOfMicrosecond
  : Shim.endOfMicrosecond
export const diffYears = Temporal ? Native.diffYears : Shim.diffYears
export const diffMonths = Temporal ? Native.diffMonths : Shim.diffMonths
export const diffWeeks = Temporal ? Native.diffWeeks : Shim.diffWeeks
export const diffDays = Temporal ? Native.diffDays : Shim.diffDays
export const diffHours = Temporal ? Native.diffHours : Shim.diffHours
export const diffMinutes = Temporal ? Native.diffMinutes : Shim.diffMinutes
export const diffSeconds = Temporal ? Native.diffSeconds : Shim.diffSeconds
export const diffMilliseconds = Temporal
  ? Native.diffMilliseconds
  : Shim.diffMilliseconds
export const diffMicroseconds = Temporal
  ? Native.diffMicroseconds
  : Shim.diffMicroseconds
export const diffNanoseconds = Temporal
  ? Native.diffNanoseconds
  : Shim.diffNanoseconds
