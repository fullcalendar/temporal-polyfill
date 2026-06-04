import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCode,
  computeCalendarMonthsInYear,
  computeCalendarWeekOfYear,
  computeCalendarYearOfWeek,
} from '../../internal/calendarDerived'
import { CalendarSlot, getCalendarSlotId } from '../../internal/calendarSlot'
import { toStrictInteger } from '../../internal/cast'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../../internal/compare'
import { constructDateTimeSlots } from '../../internal/construct'
import { plainDateTimeToZonedDateTime } from '../../internal/convert'
import { refinePlainDateTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainDateTimes } from '../../internal/diff'
import {
  epochNanoToIso,
  isoDateTimeToEpochMilli,
  isoDateTimeToEpochNano,
} from '../../internal/epochMath'
import { timeFieldDefaults } from '../../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformDateTimeOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import {
  formatDateTimeIsoAuto,
  formatPlainDateTimeIso,
} from '../../internal/isoFormat'
import { parsePlainDateTime } from '../../internal/isoParse'
import { mergePlainDateTimeFields } from '../../internal/merge'
import { movePlainDateTime } from '../../internal/move'
import {
  IsoDateTimeInterval,
  computeDayFloor,
  roundPlainDateTimeToUnit,
} from '../../internal/round'
import { getCommonCalendar } from '../../internal/slotUtils'
import {
  createDateSlots,
  createDateTimeSlots,
  createTimeSlots,
} from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import {
  DayTimeUnit,
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainDateTimeSlots,
  getPlainTimeSlotsIfPresent,
  setPlainDateTimeSlots,
} from '../temporalRecords'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import {
  diffPlainDateTimeMonths,
  diffPlainDateTimeYears,
  diffPlainDays,
  diffPlainTimeUnits,
  diffPlainWeeks,
} from './diffUtils'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import {
  moveByDaysStrict,
  moveByIsoWeeks,
  moveByMonths,
  moveByYears,
  moveToDayOfMonth,
  moveToDayOfWeek,
  moveToDayOfYear,
  moveToWeekOfYear,
  reversedMove,
} from './moveUtils'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import type { PlainTimeShimRecord } from './plainTime'
import { createPlainTimeShimRecord } from './plainTime'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import { refineRoundToOptions } from './roundUtils'
import {
  computeIsoWeekCeil,
  computeIsoWeekFloor,
  computeIsoWeekInterval,
  computeMonthCeil,
  computeMonthFloor,
  computeMonthInterval,
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
  roundDateTimeToInterval,
} from './roundUtils'
import { rejectInvalidBag } from './temporalRecords'
import {
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<PlainDateTimeShimRecord>

type PlainDateTimeRecord = RecordTypes.PlainDateTimeRecord

type PlainDateTimeShimSlots = ReturnType<typeof constructDateTimeSlots>

export const getPlainDateTimeShimRecordSlots: (
  record: unknown,
) => PlainDateTimeShimSlots = getPlainDateTimeSlots

class _PlainDateTimeShimRecord implements DateTimeFields, PlainDateTimeRecord {
  declare readonly [RecordTypes.PlainDateTimeRecordBrand]: undefined

  get calendarId() {
    return getCalendarSlotId(getPlainDateTimeShimRecordSlots(this).calendar)
  }

  get era() {
    const slots = getPlainDateTimeShimRecordSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear() {
    const slots = getPlainDateTimeShimRecordSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year() {
    const slots = getPlainDateTimeShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month() {
    const slots = getPlainDateTimeShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode() {
    const slots = getPlainDateTimeShimRecordSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day() {
    const slots = getPlainDateTimeShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  get hour() {
    return getPlainDateTimeShimRecordSlots(this).hour
  }

  get minute() {
    return getPlainDateTimeShimRecordSlots(this).minute
  }

  get second() {
    return getPlainDateTimeShimRecordSlots(this).second
  }

  get millisecond() {
    return getPlainDateTimeShimRecordSlots(this).millisecond
  }

  get microsecond() {
    return getPlainDateTimeShimRecordSlots(this).microsecond
  }

  get nanosecond() {
    return getPlainDateTimeShimRecordSlots(this).nanosecond
  }

  toJSON() {
    return formatDateTimeIsoAuto(getPlainDateTimeShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainDateTimeShimRecordSlots(
  instance: object,
  slots: PlainDateTimeShimSlots,
) {
  setPlainDateTimeSlots(instance, slots)
  attachDebugString(instance, slots, formatDateTimeIsoAuto)
}

export function createPlainDateTimeShimRecord(
  slots: PlainDateTimeShimSlots,
): PlainDateTimeShimRecord {
  const instance = Object.create(PlainDateTimeShimRecord.prototype)
  setPlainDateTimeShimRecordSlots(instance, slots)
  return instance
}

export type PlainDateTimeShimRecord = _PlainDateTimeShimRecord
export const PlainDateTimeShimRecord = defineTemporalClass(
  _PlainDateTimeShimRecord,
  'PlainDateTime',
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
  calendar?: CalendarShimRecord,
): PlainDateTimeShimRecord {
  return createPlainDateTimeShimRecord(
    constructDateTimeSlots(
      refineCalendarShimArg,
      isoYear,
      isoMonth,
      isoDay,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      calendar,
    ),
  )
}

export function fromFields(
  fields: Partial<DateTimeFields> & { calendar: CalendarShimRecord },
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const calendarSlot = refineCalendarShimArg(fields.calendar)
  // already proper slots
  const resSlots = refinePlainDateTimeObjectLike(calendarSlot, fields, options)
  return createPlainDateTimeShimRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendar: CalendarShimResolver,
): PlainDateTimeShimRecord {
  return createPlainDateTimeShimRecord(
    parsePlainDateTime(s, createCalendarShimStringResolver(getCalendar)),
  )
}

export function withCalendar(
  record: PlainDateTimeShimRecord,
  inputCalendar: CalendarShimRecord,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const calendarSlot = refineCalendarShimArg(inputCalendar)
  return createPlainDateTimeShimRecord(createDateTimeSlots(slots, calendarSlot))
}

export function withFields(
  record: PlainDateTimeShimRecord,
  mod: Partial<DateTimeFields>,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  // already proper slots
  const resSlots = mergePlainDateTimeFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createPlainDateTimeShimRecord(resSlots)
}

export function withPlainTime(
  record: PlainDateTimeShimRecord,
  plainTimeRecord: PlainTimeShimRecord | TimeFields = timeFieldDefaults,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const timeFields =
    getPlainTimeSlotsIfPresent<TimeFields>(plainTimeRecord) || plainTimeRecord
  const resSlots = createPlainDateTimeFromRefinedFields(
    slots,
    timeFields,
    slots.calendar,
  )
  return createPlainDateTimeShimRecord(resSlots)
}

export function dayOfWeek(record: PlainDateTimeShimRecord): number {
  return computeIsoDayOfWeek(getPlainDateTimeShimRecordSlots(record))
}

export function daysInWeek(record: PlainDateTimeShimRecord): number {
  getPlainDateTimeShimRecordSlots(record)
  return 7
}

export function weekOfYear(
  record: PlainDateTimeShimRecord,
): number | undefined {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(
  record: PlainDateTimeShimRecord,
): number | undefined {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function dayOfYear(record: PlainDateTimeShimRecord): number {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function daysInMonth(record: PlainDateTimeShimRecord): number {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: PlainDateTimeShimRecord): number {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: PlainDateTimeShimRecord): number {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: PlainDateTimeShimRecord): boolean {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function add(
  record: PlainDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDateTime(false, slots, durationSlots, options)
  return createPlainDateTimeShimRecord(resSlots)
}

export function subtract(
  record: PlainDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDateTime(true, slots, durationSlots, options)
  return createPlainDateTimeShimRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainDateTimeShimRecord,
  otherRecord: PlainDateTimeShimRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): DurationShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const otherSlots = getPlainDateTimeShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDateTimes(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function equals(
  record: PlainDateTimeShimRecord,
  otherRecord: PlainDateTimeShimRecord,
): boolean {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const otherSlots = getPlainDateTimeShimRecordSlots(otherRecord)
  return plainDateTimesEqual(slots, otherSlots)
}

export function compare(
  record: PlainDateTimeShimRecord,
  otherRecord: PlainDateTimeShimRecord,
): NumberSign {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const otherSlots = getPlainDateTimeShimRecordSlots(otherRecord)
  return compareIsoDateTimeFields(slots, otherSlots)
}

export function toZonedDateTime(
  record: PlainDateTimeShimRecord,
  timeZoneId: string,
  options?: Temporal.DisambiguationOptions,
): ZonedDateTimeShimRecord {
  const resSlots = plainDateTimeToZonedDateTime(
    getPlainDateTimeShimRecordSlots(record),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
    options,
  )
  return createZonedDateTimeShimRecord(resSlots)
}

export function toPlainDate(
  record: PlainDateTimeShimRecord,
): PlainDateShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const resSlots = createDateSlots(slots, slots.calendar)
  return createPlainDateShimRecord(resSlots)
}

export function toPlainTime(
  record: PlainDateTimeShimRecord,
): PlainTimeShimRecord {
  const resSlots = createTimeSlots(getPlainDateTimeShimRecordSlots(record))
  return createPlainTimeShimRecord(resSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<PlainDateTimeShimRecord>({
  transformOptions: (options) =>
    applyPlainFormatTimeZone(
      transformDateTimeOptions(options, /* allowPartialOverlap = */ true),
    ),
  createArgsProvider: (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getPlainDateTimeShimRecordSlots(record)
      const format = internals.format
      checkResolvedCalendarCompatible(format, slots)
      return [format, isoDateTimeToEpochMilli(slots)!]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getPlainDateTimeShimRecordSlots(record0)
      const slots1 = getPlainDateTimeShimRecordSlots(record1)
      const format = internals.format
      checkResolvedCalendarCompatible(format, slots0)
      checkResolvedCalendarCompatible(format, slots1)
      return [
        format,
        isoDateTimeToEpochMilli(slots0)!,
        isoDateTimeToEpochMilli(slots1)!,
      ]
    },
  }),
})

export function toLocaleString(
  record: PlainDateTimeShimRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(
      transformDateTimeOptions(options, /* allowPartialOverlap = */ false),
    ),
  )
  checkResolvedCalendarCompatible(format, slots)
  return format.format(isoDateTimeToEpochMilli(slots)!)
}

export function toString(
  record: PlainDateTimeShimRecord,
  options?: Temporal.PlainDateTimeToStringOptions,
): string {
  return formatPlainDateTimeIso(
    getPlainDateTimeShimRecordSlots(record),
    options,
  )
}

export function toSimpleString(record: PlainDateTimeShimRecord): string {
  return formatDateTimeIsoAuto(getPlainDateTimeShimRecordSlots(record))
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: PlainDateTimeShimRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveToDayOfYear(slots, dayOfYear, options),
      slots,
      slots.calendar,
    ),
  )
}

export function withDayOfMonth(
  record: PlainDateTimeShimRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveToDayOfMonth(slots, dayOfMonth, options),
      slots,
      slots.calendar,
    ),
  )
}

export function withDayOfWeek(
  record: PlainDateTimeShimRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveToDayOfWeek(slots, dayOfWeek, options),
      slots,
      slots.calendar,
    ),
  )
}

export function withWeekOfYear(
  record: PlainDateTimeShimRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveToWeekOfYear(slots, weekOfYear, options),
      slots,
      slots.calendar,
    ),
  )
}

// Non-standard: Add
// -----------------------------------------------------------------------------

export function addYears(
  record: PlainDateTimeShimRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveByYears(slots, years, options),
      slots,
      slots.calendar,
    ),
  )
}

export function addMonths(
  record: PlainDateTimeShimRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveByMonths(slots, months, options),
      slots,
      slots.calendar,
    ),
  )
}

export function addWeeks(
  record: PlainDateTimeShimRecord,
  weeks: number,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveByIsoWeeks(slots, weeks),
      slots,
      slots.calendar,
    ),
  )
}

export function addDays(
  record: PlainDateTimeShimRecord,
  days: number,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      moveByDaysStrict(slots, days),
      slots,
      slots.calendar,
    ),
  )
}

export const addHours = bindArgs(moveByTimeUnit, nanoInHour)
export const addMinutes = bindArgs(moveByTimeUnit, nanoInMinute)
export const addSeconds = bindArgs(moveByTimeUnit, nanoInSec)
export const addMilliseconds = bindArgs(moveByTimeUnit, nanoInMilli)
export const addMicroseconds = bindArgs(moveByTimeUnit, nanoInMicro)
export const addNanoseconds = bindArgs(moveByTimeUnit, 1)

export const subtractYears = reversedMove(addYears)
export const subtractMonths = reversedMove(addMonths)
export const subtractWeeks = reversedMove(addWeeks)
export const subtractDays = reversedMove(addDays)
export const subtractHours = reversedMove(addHours)
export const subtractMinutes = reversedMove(addMinutes)
export const subtractSeconds = reversedMove(addSeconds)
export const subtractMilliseconds = reversedMove(addMilliseconds)
export const subtractMicroseconds = reversedMove(addMicroseconds)
export const subtractNanoseconds = reversedMove(addNanoseconds)

// Non-standard: Round
// -----------------------------------------------------------------------------

export const roundToYear = bindArgs(
  roundToInterval,
  Unit.Year,
  computeYearInterval,
)

export const roundToMonth = bindArgs(
  roundToInterval,
  Unit.Month,
  computeMonthInterval,
)

export const roundToWeek = bindArgs(
  roundToInterval,
  Unit.Week,
  computeIsoWeekInterval,
)

function roundToDayTimeUnit(
  smallestUnit: DayTimeUnit,
  record: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): PlainDateTimeShimRecord {
  // We already hold smallestUnit as a separate arg, so refine the options
  // directly instead of synthesizing a raw options bag for re-parsing.
  const [roundingInc, roundingMode] = refineRoundToOptions(
    smallestUnit,
    options,
  )
  return createPlainDateTimeShimRecord(
    roundPlainDateTimeToUnit(
      getPlainDateTimeShimRecordSlots(record),
      smallestUnit,
      roundingInc,
      roundingMode,
    ),
  )
}

export const roundToDay = bindArgs(roundToDayTimeUnit, Unit.Day)
export const roundToHour = bindArgs(roundToDayTimeUnit, Unit.Hour)
export const roundToMinute = bindArgs(roundToDayTimeUnit, Unit.Minute)
export const roundToSecond = bindArgs(roundToDayTimeUnit, Unit.Second)
export const roundToMillisecond = bindArgs(roundToDayTimeUnit, Unit.Millisecond)
export const roundToMicrosecond = bindArgs(roundToDayTimeUnit, Unit.Microsecond)

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear = aligned(computeYearFloor)
export const startOfMonth = aligned(computeMonthFloor)
export const startOfWeek = aligned(computeIsoWeekFloor)
export const startOfDay = alignedDateTimeStart(computeDayFloor)
export const startOfHour = alignedTimeStart((slots) => ({
  hour: slots.hour,
  minute: 0,
  second: 0,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfMinute = alignedTimeStart((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: 0,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfSecond = alignedTimeStart((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfMillisecond = alignedTimeStart((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: slots.millisecond,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfMicrosecond = alignedTimeStart((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: slots.millisecond,
  microsecond: slots.microsecond,
  nanosecond: 0,
}))

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear = aligned(computeYearCeil, -1)
export const endOfMonth = aligned(computeMonthCeil, -1)
export const endOfWeek = aligned(computeIsoWeekCeil, -1)
export const endOfDay = alignedTimeEnd(() => ({
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
  microsecond: 999,
  nanosecond: 999,
}))
export const endOfHour = alignedTimeEnd((slots) => ({
  hour: slots.hour,
  minute: 59,
  second: 59,
  millisecond: 999,
  microsecond: 999,
  nanosecond: 999,
}))
export const endOfMinute = alignedTimeEnd((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: 59,
  millisecond: 999,
  microsecond: 999,
  nanosecond: 999,
}))
export const endOfSecond = alignedTimeEnd((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: 999,
  microsecond: 999,
  nanosecond: 999,
}))
export const endOfMillisecond = alignedTimeEnd((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: slots.millisecond,
  microsecond: 999,
  nanosecond: 999,
}))
export const endOfMicrosecond = alignedTimeEnd((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: slots.millisecond,
  microsecond: slots.microsecond,
  nanosecond: 999,
}))

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: PlainDateTimeShimRecord,
  record1: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateTimeYears(
    getPlainDateTimeShimRecordSlots(record0),
    getPlainDateTimeShimRecordSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: PlainDateTimeShimRecord,
  record1: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateTimeMonths(
    getPlainDateTimeShimRecordSlots(record0),
    getPlainDateTimeShimRecordSlots(record1),
    options,
  )
}

export function diffWeeks(
  record0: PlainDateTimeShimRecord,
  record1: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainWeeks(
    getPlainDateTimeShimRecordSlots(record0),
    getPlainDateTimeShimRecordSlots(record1),
    options,
  )
}

export function diffDays(
  record0: PlainDateTimeShimRecord,
  record1: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDays(
    getPlainDateTimeShimRecordSlots(record0),
    getPlainDateTimeShimRecordSlots(record1),
    options,
  )
}

export const diffHours = bindArgs(diffTimeUnits, Unit.Hour, nanoInHour)
export const diffMinutes = bindArgs(diffTimeUnits, Unit.Minute, nanoInMinute)
export const diffSeconds = bindArgs(diffTimeUnits, Unit.Second, nanoInSec)
export const diffMilliseconds = bindArgs(
  diffTimeUnits,
  Unit.Millisecond,
  nanoInMilli,
)
export const diffMicroseconds = bindArgs(
  diffTimeUnits,
  Unit.Microsecond,
  nanoInMicro,
)
export const diffNanoseconds = bindArgs(diffTimeUnits, Unit.Nanosecond, 1)

function diffTimeUnits(
  unit: Unit,
  nanoInUnit: number,
  record0: PlainDateTimeShimRecord,
  record1: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainTimeUnits(
    unit as any,
    nanoInUnit,
    getPlainDateTimeShimRecordSlots(record0),
    getPlainDateTimeShimRecordSlots(record1),
    options,
  )
}

function moveByTimeUnit(
  nanoInUnit: number,
  record: PlainDateTimeShimRecord,
  units: number,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const epochNano0 = isoDateTimeToEpochNano(slots)!
  const epochNano1 =
    epochNano0 + BigInt(toStrictInteger(units)) * BigInt(nanoInUnit)
  const isoDateTime1 = epochNanoToIso(epochNano1, 0)
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      isoDateTime1,
      isoDateTime1,
      slots.calendar,
    ),
  )
}

function roundToInterval(
  unit: Unit,
  computeInterval: (
    slots: CalendarDateFields & { calendar: CalendarSlot },
  ) => IsoDateTimeInterval,
  record: PlainDateTimeShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const [, roundingMode] = refineRoundToOptions(unit, options)
  const isoDateTime = roundDateTimeToInterval(
    computeInterval,
    slots,
    roundingMode,
  )
  return createPlainDateTimeShimRecord(
    createPlainDateTimeFromRefinedFields(
      isoDateTime,
      isoDateTime,
      slots.calendar,
    ),
  )
}

function aligned(
  computeAlignment: (slots: PlainDateTimeShimSlots) => CalendarDateTimeFields,
  nanoDelta = 0,
): (record: PlainDateTimeShimRecord) => PlainDateTimeShimRecord {
  return (record) => {
    const slots = getPlainDateTimeShimRecordSlots(record)
    let isoDateTime = computeAlignment(slots)

    if (nanoDelta) {
      isoDateTime = epochNanoToIso(
        isoDateTimeToEpochNano(isoDateTime)!,
        nanoDelta,
      )
    }

    return createPlainDateTimeShimRecord(
      createPlainDateTimeFromRefinedFields(
        isoDateTime,
        isoDateTime,
        slots.calendar,
      ),
    )
  }
}

function alignedDateTimeStart(
  computeAlignment: (slots: PlainDateTimeShimSlots) => CalendarDateTimeFields,
): (record: PlainDateTimeShimRecord) => PlainDateTimeShimRecord {
  return (record) => {
    const slots = getPlainDateTimeShimRecordSlots(record)
    // DateTime starts at or below the day unit only clear time fields on an
    // already-valid PlainDateTime. The ISO date is unchanged, so no bounds
    // check is needed.
    return createPlainDateTimeShimRecord(
      createDateTimeSlots(computeAlignment(slots), slots.calendar),
    )
  }
}

function alignedTimeStart(
  computeAlignment: (time: TimeFields) => TimeFields,
): (record: PlainDateTimeShimRecord) => PlainDateTimeShimRecord {
  return (record) => {
    const slots = getPlainDateTimeShimRecordSlots(record)
    // Time floors only zero sub-hour/minute/etc. fields on an already-valid
    // PlainDateTime. The ISO date is unchanged, so no bounds check is needed.
    return createPlainDateTimeShimRecord(
      createDateTimeSlots(
        combineDateAndTime(slots, computeAlignment(slots)),
        slots.calendar,
      ),
    )
  }
}

function alignedTimeEnd(
  computeAlignment: (time: TimeFields) => TimeFields,
): (record: PlainDateTimeShimRecord) => PlainDateTimeShimRecord {
  return (record) => {
    const slots = getPlainDateTimeShimRecordSlots(record)
    // Time ceilings at or below the day unit only set fields within an
    // already-valid PlainDateTime. The ISO date is unchanged, so no epoch math
    // or bounds check is needed.
    return createPlainDateTimeShimRecord(
      createDateTimeSlots(
        combineDateAndTime(slots, computeAlignment(slots)),
        slots.calendar,
      ),
    )
  }
}
