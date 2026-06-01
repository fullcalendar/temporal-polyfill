import type { Temporal } from 'temporal-spec'
import { DateTimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type {
  RoundingMathOptions,
  RoundingModeName,
} from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/plainDateTime'
import type {
  CalendarRecord,
  DurationRecord,
  PlainDateRecord,
  PlainDateTimeRecord as Record,
  PlainTimeRecord,
  ZonedDateTimeRecord,
} from './recordTypes'
import * as Shim from './shim/plainDateTime'
import { isPlainDateTimeRecord } from './temporalRecords'

export type { Record }

type PlainDateTimeRecord = Record

export const create: (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
  calendar?: CalendarRecord,
) => PlainDateTimeRecord = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainDateTimeRecord as (arg: unknown) => arg is Record

export const fromFields: (
  fields: Partial<DateTimeFields> & { calendar: CalendarRecord },
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarRecord,
) => PlainDateTimeRecord = NativeTemporal ? Native.fromString : Shim.fromString

export const withCalendar: (
  record: PlainDateTimeRecord,
  calendarRecord: CalendarRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.withCalendar
  : Shim.withCalendar

export const withFields: (
  record: PlainDateTimeRecord,
  mod: Partial<DateTimeFields>,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const withPlainTime: (
  record: PlainDateTimeRecord,
  plainTimeRecord?: PlainTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.withPlainTime
  : Shim.withPlainTime

export const dayOfWeek: (record: PlainDateTimeRecord) => number = NativeTemporal
  ? Native.dayOfWeek
  : Shim.dayOfWeek

export const daysInWeek: (record: PlainDateTimeRecord) => number =
  NativeTemporal ? Native.daysInWeek : Shim.daysInWeek

export const weekOfYear: (record: PlainDateTimeRecord) => number | undefined =
  NativeTemporal ? Native.weekOfYear : Shim.weekOfYear

export const yearOfWeek: (record: PlainDateTimeRecord) => number | undefined =
  NativeTemporal ? Native.yearOfWeek : Shim.yearOfWeek

export const dayOfYear: (record: PlainDateTimeRecord) => number = NativeTemporal
  ? Native.dayOfYear
  : Shim.dayOfYear

export const daysInMonth: (record: PlainDateTimeRecord) => number =
  NativeTemporal ? Native.daysInMonth : Shim.daysInMonth

export const daysInYear: (record: PlainDateTimeRecord) => number =
  NativeTemporal ? Native.daysInYear : Shim.daysInYear

export const monthsInYear: (record: PlainDateTimeRecord) => number =
  NativeTemporal ? Native.monthsInYear : Shim.monthsInYear

export const inLeapYear: (record: PlainDateTimeRecord) => boolean =
  NativeTemporal ? Native.inLeapYear : Shim.inLeapYear

export const add: (
  record: PlainDateTimeRecord,
  duration: DurationRecord,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: PlainDateTimeRecord,
  duration: DurationRecord,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: PlainDateTimeRecord,
  otherRecord: PlainDateTimeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const equals: (
  record: PlainDateTimeRecord,
  otherRecord: PlainDateTimeRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: PlainDateTimeRecord,
  otherRecord: PlainDateTimeRecord,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toZonedDateTime: (
  record: PlainDateTimeRecord,
  timeZoneId: string,
  options?: Temporal.DisambiguationOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.toZonedDateTime
  : Shim.toZonedDateTime

export const toPlainDate: (record: PlainDateTimeRecord) => PlainDateRecord =
  NativeTemporal ? Native.toPlainDate : Shim.toPlainDate

export const toPlainTime: (record: PlainDateTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.toPlainTime : Shim.toPlainTime

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<PlainDateTimeRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: PlainDateTimeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  record: PlainDateTimeRecord,
  options?: Temporal.PlainDateTimeToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: PlainDateTimeRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString

export const withDayOfYear: (
  record: PlainDateTimeRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.withDayOfYear
  : Shim.withDayOfYear

export const withDayOfMonth: (
  record: PlainDateTimeRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.withDayOfMonth
  : Shim.withDayOfMonth

export const withDayOfWeek: (
  record: PlainDateTimeRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.withDayOfWeek
  : Shim.withDayOfWeek

export const withWeekOfYear: (
  record: PlainDateTimeRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.withWeekOfYear
  : Shim.withWeekOfYear

export const addYears: (
  record: PlainDateTimeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal ? Native.addYears : Shim.addYears

export const addMonths: (
  record: PlainDateTimeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal ? Native.addMonths : Shim.addMonths

export const addWeeks: (
  record: PlainDateTimeRecord,
  weeks: number,
) => PlainDateTimeRecord = NativeTemporal ? Native.addWeeks : Shim.addWeeks

export const addDays: (
  record: PlainDateTimeRecord,
  days: number,
) => PlainDateTimeRecord = NativeTemporal ? Native.addDays : Shim.addDays

export const addHours: (
  record: PlainDateTimeRecord,
  hours: number,
) => PlainDateTimeRecord = NativeTemporal ? Native.addHours : Shim.addHours

export const addMinutes: (
  record: PlainDateTimeRecord,
  minutes: number,
) => PlainDateTimeRecord = NativeTemporal ? Native.addMinutes : Shim.addMinutes

export const addSeconds: (
  record: PlainDateTimeRecord,
  seconds: number,
) => PlainDateTimeRecord = NativeTemporal ? Native.addSeconds : Shim.addSeconds

export const addMilliseconds: (
  record: PlainDateTimeRecord,
  milliseconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.addMilliseconds
  : Shim.addMilliseconds

export const addMicroseconds: (
  record: PlainDateTimeRecord,
  microseconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.addMicroseconds
  : Shim.addMicroseconds

export const addNanoseconds: (
  record: PlainDateTimeRecord,
  nanoseconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.addNanoseconds
  : Shim.addNanoseconds

export const subtractYears: (
  record: PlainDateTimeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractYears
  : Shim.subtractYears

export const subtractMonths: (
  record: PlainDateTimeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractMonths
  : Shim.subtractMonths

export const subtractWeeks: (
  record: PlainDateTimeRecord,
  weeks: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractWeeks
  : Shim.subtractWeeks

export const subtractDays: (
  record: PlainDateTimeRecord,
  days: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractDays
  : Shim.subtractDays

export const subtractHours: (
  record: PlainDateTimeRecord,
  hours: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractHours
  : Shim.subtractHours

export const subtractMinutes: (
  record: PlainDateTimeRecord,
  minutes: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractMinutes
  : Shim.subtractMinutes

export const subtractSeconds: (
  record: PlainDateTimeRecord,
  seconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractSeconds
  : Shim.subtractSeconds

export const subtractMilliseconds: (
  record: PlainDateTimeRecord,
  milliseconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds

export const subtractMicroseconds: (
  record: PlainDateTimeRecord,
  microseconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds

export const subtractNanoseconds: (
  record: PlainDateTimeRecord,
  nanoseconds: number,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds

export const roundToYear: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToYear
  : Shim.roundToYear

export const roundToMonth: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToMonth
  : Shim.roundToMonth

export const roundToWeek: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToWeek
  : Shim.roundToWeek

export const roundToDay: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal ? Native.roundToDay : Shim.roundToDay

export const roundToHour: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToHour
  : Shim.roundToHour

export const roundToMinute: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToMinute
  : Shim.roundToMinute

export const roundToSecond: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToSecond
  : Shim.roundToSecond

export const roundToMillisecond: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToMillisecond
  : Shim.roundToMillisecond

export const roundToMicrosecond: (
  record: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.roundToMicrosecond
  : Shim.roundToMicrosecond

export const startOfYear: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.startOfYear : Shim.startOfYear

export const startOfMonth: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.startOfMonth
  : Shim.startOfMonth

export const startOfWeek: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.startOfWeek : Shim.startOfWeek

export const startOfDay: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.startOfDay : Shim.startOfDay

export const startOfHour: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.startOfHour : Shim.startOfHour

export const startOfMinute: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.startOfMinute
  : Shim.startOfMinute

export const startOfSecond: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.startOfSecond
  : Shim.startOfSecond

export const startOfMillisecond: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.startOfMillisecond
  : Shim.startOfMillisecond

export const startOfMicrosecond: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.startOfMicrosecond
  : Shim.startOfMicrosecond

export const endOfYear: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfYear : Shim.endOfYear

export const endOfMonth: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfMonth : Shim.endOfMonth

export const endOfWeek: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfWeek : Shim.endOfWeek

export const endOfDay: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfDay : Shim.endOfDay

export const endOfHour: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfHour : Shim.endOfHour

export const endOfMinute: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfMinute : Shim.endOfMinute

export const endOfSecond: (record: PlainDateTimeRecord) => PlainDateTimeRecord =
  NativeTemporal ? Native.endOfSecond : Shim.endOfSecond

export const endOfMillisecond: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.endOfMillisecond
  : Shim.endOfMillisecond

export const endOfMicrosecond: (
  record: PlainDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.endOfMicrosecond
  : Shim.endOfMicrosecond

export const diffYears: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffYears : Shim.diffYears

export const diffMonths: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMonths : Shim.diffMonths

export const diffWeeks: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffWeeks : Shim.diffWeeks

export const diffDays: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffDays : Shim.diffDays

export const diffHours: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffHours : Shim.diffHours

export const diffMinutes: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMinutes : Shim.diffMinutes

export const diffSeconds: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffSeconds : Shim.diffSeconds

export const diffMilliseconds: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMilliseconds : Shim.diffMilliseconds

export const diffMicroseconds: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMicroseconds : Shim.diffMicroseconds

export const diffNanoseconds: (
  record0: PlainDateTimeRecord,
  record1: PlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffNanoseconds : Shim.diffNanoseconds
