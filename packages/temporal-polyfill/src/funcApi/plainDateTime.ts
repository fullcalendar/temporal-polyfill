import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/plainDateTime'
import * as Shim from './shim/plainDateTime'
import { getPlainDateTimeRecordIfPresent } from './temporalRecords'

export const create = NativeTemporal ? Native.create : Shim.create
export function isRecord(
  arg: unknown,
): arg is Native.PlainDateTimeNativeRecord | Shim.PlainDateTimeShimRecord {
  return !!getPlainDateTimeRecordIfPresent(arg)
}
export const fromFields = NativeTemporal ? Native.fromFields : Shim.fromFields
export const fromString = NativeTemporal ? Native.fromString : Shim.fromString
export const withCalendar = NativeTemporal
  ? Native.withCalendar
  : Shim.withCalendar
export const withFields = NativeTemporal ? Native.withFields : Shim.withFields
export const withPlainTime = NativeTemporal
  ? Native.withPlainTime
  : Shim.withPlainTime
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
export const add = NativeTemporal ? Native.add : Shim.add
export const subtract = NativeTemporal ? Native.subtract : Shim.subtract
export const diff = NativeTemporal ? Native.diff : Shim.diff
export const round = NativeTemporal ? Native.round : Shim.round
export const equals = NativeTemporal ? Native.equals : Shim.equals
export const compare = NativeTemporal ? Native.compare : Shim.compare
export const toZonedDateTime = NativeTemporal
  ? Native.toZonedDateTime
  : Shim.toZonedDateTime
export const toPlainDate = NativeTemporal
  ? Native.toPlainDate
  : Shim.toPlainDate
export const toPlainTime = NativeTemporal
  ? Native.toPlainTime
  : Shim.toPlainTime
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
export const addHours = NativeTemporal ? Native.addHours : Shim.addHours
export const addMinutes = NativeTemporal ? Native.addMinutes : Shim.addMinutes
export const addSeconds = NativeTemporal ? Native.addSeconds : Shim.addSeconds
export const addMilliseconds = NativeTemporal
  ? Native.addMilliseconds
  : Shim.addMilliseconds
export const addMicroseconds = NativeTemporal
  ? Native.addMicroseconds
  : Shim.addMicroseconds
export const addNanoseconds = NativeTemporal
  ? Native.addNanoseconds
  : Shim.addNanoseconds
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
export const subtractHours = NativeTemporal
  ? Native.subtractHours
  : Shim.subtractHours
export const subtractMinutes = NativeTemporal
  ? Native.subtractMinutes
  : Shim.subtractMinutes
export const subtractSeconds = NativeTemporal
  ? Native.subtractSeconds
  : Shim.subtractSeconds
export const subtractMilliseconds = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds
export const subtractMicroseconds = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds
export const subtractNanoseconds = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds
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
export const startOfDay = NativeTemporal ? Native.startOfDay : Shim.startOfDay
export const startOfHour = NativeTemporal
  ? Native.startOfHour
  : Shim.startOfHour
export const startOfMinute = NativeTemporal
  ? Native.startOfMinute
  : Shim.startOfMinute
export const startOfSecond = NativeTemporal
  ? Native.startOfSecond
  : Shim.startOfSecond
export const startOfMillisecond = NativeTemporal
  ? Native.startOfMillisecond
  : Shim.startOfMillisecond
export const startOfMicrosecond = NativeTemporal
  ? Native.startOfMicrosecond
  : Shim.startOfMicrosecond
export const endOfYear = NativeTemporal ? Native.endOfYear : Shim.endOfYear
export const endOfMonth = NativeTemporal ? Native.endOfMonth : Shim.endOfMonth
export const endOfWeek = NativeTemporal ? Native.endOfWeek : Shim.endOfWeek
export const endOfDay = NativeTemporal ? Native.endOfDay : Shim.endOfDay
export const endOfHour = NativeTemporal ? Native.endOfHour : Shim.endOfHour
export const endOfMinute = NativeTemporal
  ? Native.endOfMinute
  : Shim.endOfMinute
export const endOfSecond = NativeTemporal
  ? Native.endOfSecond
  : Shim.endOfSecond
export const endOfMillisecond = NativeTemporal
  ? Native.endOfMillisecond
  : Shim.endOfMillisecond
export const endOfMicrosecond = NativeTemporal
  ? Native.endOfMicrosecond
  : Shim.endOfMicrosecond
export const diffYears = NativeTemporal ? Native.diffYears : Shim.diffYears
export const diffMonths = NativeTemporal ? Native.diffMonths : Shim.diffMonths
export const diffWeeks = NativeTemporal ? Native.diffWeeks : Shim.diffWeeks
export const diffDays = NativeTemporal ? Native.diffDays : Shim.diffDays
export const diffHours = NativeTemporal ? Native.diffHours : Shim.diffHours
export const diffMinutes = NativeTemporal
  ? Native.diffMinutes
  : Shim.diffMinutes
export const diffSeconds = NativeTemporal
  ? Native.diffSeconds
  : Shim.diffSeconds
export const diffMilliseconds = NativeTemporal
  ? Native.diffMilliseconds
  : Shim.diffMilliseconds
export const diffMicroseconds = NativeTemporal
  ? Native.diffMicroseconds
  : Shim.diffMicroseconds
export const diffNanoseconds = NativeTemporal
  ? Native.diffNanoseconds
  : Shim.diffNanoseconds
