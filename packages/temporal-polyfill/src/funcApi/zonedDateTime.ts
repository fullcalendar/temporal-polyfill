import type { Temporal } from 'temporal-spec'
import { DateTimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike, ZonedDateTimeFields } from './commonTypes'
import * as Native from './native/zonedDateTime'
import type {
  CalendarRecord,
  DurationRecord,
  InstantRecord,
  PlainDateRecord,
  PlainDateTimeRecord,
  PlainTimeRecord,
  ZonedDateTimeRecord as Record,
} from './recordTypes'
import * as Shim from './shim/zonedDateTime'
import { isZonedDateTimeRecord } from './temporalRecords'

export type { Record }

type ZonedDateTimeRecord = Record
export type FromFields = ZonedDateTimeFields<CalendarRecord>
export type WithFields = Partial<DateTimeFields>
type FromOptions = Temporal.ZonedDateTimeFromOptions
type ToStringOptions = Temporal.ZonedDateTimeToStringOptions
type OverflowOptions = Temporal.OverflowOptions
type TransitionOptions = Temporal.TransitionOptions
type TransitionDirection = Temporal.TransitionOptions['direction']
export type DiffOptions = Temporal.RoundingOptionsWithLargestUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
type RoundingMathOptions = TemporalSpecHelpers.RoundingMathOptions
type RoundingModeName = TemporalSpecHelpers.RoundingModeName

export const create: (
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: CalendarRecord,
) => ZonedDateTimeRecord = NativeTemporal ? Native.create : Shim.create

export const isRecord = isZonedDateTimeRecord as (arg: unknown) => arg is Record

export const fromFields: (
  fields: FromFields,
  options?: FromOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarRecord,
  options?: FromOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.fromString : Shim.fromString

export const withFields: (
  record: ZonedDateTimeRecord,
  mod: WithFields,
  options?: FromOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const withCalendar: (
  record: ZonedDateTimeRecord,
  calendarRecord: CalendarRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withCalendar
  : Shim.withCalendar

export const withTimeZone: (
  record: ZonedDateTimeRecord,
  timeZoneId: string,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withTimeZone
  : Shim.withTimeZone

export const withPlainTime: (
  record: ZonedDateTimeRecord,
  plainTimeRecord?: PlainTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withPlainTime
  : Shim.withPlainTime

export const offsetNanoseconds: (record: ZonedDateTimeRecord) => number =
  NativeTemporal ? Native.offsetNanoseconds : Shim.offsetNanoseconds

export const offset: (record: ZonedDateTimeRecord) => string = NativeTemporal
  ? Native.offset
  : Shim.offset

export const dayOfWeek: (record: ZonedDateTimeRecord) => number = NativeTemporal
  ? Native.dayOfWeek
  : Shim.dayOfWeek

export const daysInWeek: (record: ZonedDateTimeRecord) => number =
  NativeTemporal ? Native.daysInWeek : Shim.daysInWeek

export const weekOfYear: (record: ZonedDateTimeRecord) => number | undefined =
  NativeTemporal ? Native.weekOfYear : Shim.weekOfYear

export const yearOfWeek: (record: ZonedDateTimeRecord) => number | undefined =
  NativeTemporal ? Native.yearOfWeek : Shim.yearOfWeek

export const dayOfYear: (record: ZonedDateTimeRecord) => number = NativeTemporal
  ? Native.dayOfYear
  : Shim.dayOfYear

export const daysInMonth: (record: ZonedDateTimeRecord) => number =
  NativeTemporal ? Native.daysInMonth : Shim.daysInMonth

export const daysInYear: (record: ZonedDateTimeRecord) => number =
  NativeTemporal ? Native.daysInYear : Shim.daysInYear

export const monthsInYear: (record: ZonedDateTimeRecord) => number =
  NativeTemporal ? Native.monthsInYear : Shim.monthsInYear

export const inLeapYear: (record: ZonedDateTimeRecord) => boolean =
  NativeTemporal ? Native.inLeapYear : Shim.inLeapYear

export const hoursInDay: (record: ZonedDateTimeRecord) => number =
  NativeTemporal ? Native.hoursInDay : Shim.hoursInDay

export const toString: (
  record: ZonedDateTimeRecord,
  options?: ToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: ZonedDateTimeRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString

export const add: (
  record: ZonedDateTimeRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: ZonedDateTimeRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: ZonedDateTimeRecord,
  otherRecord: ZonedDateTimeRecord,
  options?: DiffOptions,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const startOfDay: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.startOfDay : Shim.startOfDay

export const getTimeZoneTransition: (
  record: ZonedDateTimeRecord,
  options: TransitionOptions | TransitionDirection,
) => ZonedDateTimeRecord | null = NativeTemporal
  ? Native.getTimeZoneTransition
  : Shim.getTimeZoneTransition

export const equals: (
  record: ZonedDateTimeRecord,
  otherRecord: ZonedDateTimeRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: ZonedDateTimeRecord,
  otherRecord: ZonedDateTimeRecord,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toInstant: (record: ZonedDateTimeRecord) => InstantRecord =
  NativeTemporal ? Native.toInstant : Shim.toInstant

export const toPlainDateTime: (
  record: ZonedDateTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? Native.toPlainDateTime
  : Shim.toPlainDateTime

export const toPlainDate: (record: ZonedDateTimeRecord) => PlainDateRecord =
  NativeTemporal ? Native.toPlainDate : Shim.toPlainDate

export const toPlainTime: (record: ZonedDateTimeRecord) => PlainTimeRecord =
  NativeTemporal ? Native.toPlainTime : Shim.toPlainTime

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<ZonedDateTimeRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: ZonedDateTimeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const withDayOfYear: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withDayOfYear
  : Shim.withDayOfYear

export const withDayOfMonth: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withDayOfMonth
  : Shim.withDayOfMonth

export const withDayOfWeek: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withDayOfWeek
  : Shim.withDayOfWeek

export const withWeekOfYear: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.withWeekOfYear
  : Shim.withWeekOfYear

export const addYears: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addYears : Shim.addYears

export const addMonths: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addMonths : Shim.addMonths

export const addWeeks: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addWeeks : Shim.addWeeks

export const addDays: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addDays : Shim.addDays

export const addHours: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addHours : Shim.addHours

export const addMinutes: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addMinutes : Shim.addMinutes

export const addSeconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal ? Native.addSeconds : Shim.addSeconds

export const addMilliseconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.addMilliseconds
  : Shim.addMilliseconds

export const addMicroseconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.addMicroseconds
  : Shim.addMicroseconds

export const addNanoseconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.addNanoseconds
  : Shim.addNanoseconds

export const subtractYears: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractYears
  : Shim.subtractYears

export const subtractMonths: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractMonths
  : Shim.subtractMonths

export const subtractWeeks: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractWeeks
  : Shim.subtractWeeks

export const subtractDays: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractDays
  : Shim.subtractDays

export const subtractHours: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractHours
  : Shim.subtractHours

export const subtractMinutes: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractMinutes
  : Shim.subtractMinutes

export const subtractSeconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractSeconds
  : Shim.subtractSeconds

export const subtractMilliseconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds

export const subtractMicroseconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds

export const subtractNanoseconds: (
  record: ZonedDateTimeRecord,
  value: number,
  options?: OverflowOptions,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds

export const roundToYear: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToYear
  : Shim.roundToYear

export const roundToMonth: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToMonth
  : Shim.roundToMonth

export const roundToWeek: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToWeek
  : Shim.roundToWeek

export const roundToDay: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal ? Native.roundToDay : Shim.roundToDay

export const roundToHour: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToHour
  : Shim.roundToHour

export const roundToMinute: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToMinute
  : Shim.roundToMinute

export const roundToSecond: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToSecond
  : Shim.roundToSecond

export const roundToMillisecond: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToMillisecond
  : Shim.roundToMillisecond

export const roundToMicrosecond: (
  record: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.roundToMicrosecond
  : Shim.roundToMicrosecond

export const startOfYear: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.startOfYear : Shim.startOfYear

export const startOfMonth: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.startOfMonth
  : Shim.startOfMonth

export const startOfWeek: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.startOfWeek : Shim.startOfWeek

export const startOfHour: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.startOfHour : Shim.startOfHour

export const startOfMinute: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.startOfMinute
  : Shim.startOfMinute

export const startOfSecond: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.startOfSecond
  : Shim.startOfSecond

export const startOfMillisecond: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.startOfMillisecond
  : Shim.startOfMillisecond

export const startOfMicrosecond: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.startOfMicrosecond
  : Shim.startOfMicrosecond

export const endOfYear: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfYear : Shim.endOfYear

export const endOfMonth: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfMonth : Shim.endOfMonth

export const endOfWeek: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfWeek : Shim.endOfWeek

export const endOfDay: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfDay : Shim.endOfDay

export const endOfHour: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfHour : Shim.endOfHour

export const endOfMinute: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfMinute : Shim.endOfMinute

export const endOfSecond: (record: ZonedDateTimeRecord) => ZonedDateTimeRecord =
  NativeTemporal ? Native.endOfSecond : Shim.endOfSecond

export const endOfMillisecond: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.endOfMillisecond
  : Shim.endOfMillisecond

export const endOfMicrosecond: (
  record: ZonedDateTimeRecord,
) => ZonedDateTimeRecord = NativeTemporal
  ? Native.endOfMicrosecond
  : Shim.endOfMicrosecond

export const diffYears: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffYears : Shim.diffYears

export const diffMonths: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMonths : Shim.diffMonths

export const diffWeeks: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffWeeks : Shim.diffWeeks

export const diffDays: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffDays : Shim.diffDays

export const diffHours: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffHours : Shim.diffHours

export const diffMinutes: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMinutes : Shim.diffMinutes

export const diffSeconds: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffSeconds : Shim.diffSeconds

export const diffMilliseconds: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMilliseconds : Shim.diffMilliseconds

export const diffMicroseconds: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffMicroseconds : Shim.diffMicroseconds

export const diffNanoseconds: (
  record0: ZonedDateTimeRecord,
  record1: ZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingModeName,
) => number = NativeTemporal ? Native.diffNanoseconds : Shim.diffNanoseconds
