import type { Temporal as TemporalSpec } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { dateFieldGetters, timeGetters } from '../../apiHelpers/shimMixins'
import {
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarInLeapYear,
  computeCalendarMonthsInYear,
  computeCalendarWeekOfYear,
  computeCalendarYearOfWeek,
} from '../../internal/calendarDerived'
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toIntegerWithTrunc, toStrictInteger } from '../../internal/cast'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../../internal/compare'
import { plainDateTimeToZonedDateTime } from '../../internal/convert'
import { refinePlainDateTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainDateTimes } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import {
  epochNanoToIsoDateTime,
  isoDateTimeToEpochMilli,
  isoDateTimeToEpochNano,
} from '../../internal/epochMath'
import { timeFieldDefaults } from '../../internal/fieldNames'
import {
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
import {
  computeIsoDayOfWeek,
  validateIsoDateTimeFields,
} from '../../internal/isoCalendarMath'
import {
  formatDateTimeIsoAuto,
  formatPlainDateTimeIso,
} from '../../internal/isoFormat'
import { parsePlainDateTime } from '../../internal/isoParse'
import { mergePlainDateTimeFields } from '../../internal/merge'
import { moveDateTime } from '../../internal/move'
import {
  IsoDateTimeInterval,
  computeDayFloor,
  computeNanoInc,
  roundDateTimeToNano,
} from '../../internal/round'
import { getCommonCalendar } from '../../internal/slotUtils'
import {
  createDateSlots,
  createDateTimeSlots,
  createTimeSlots,
} from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { checkIsoDateTimeInBounds } from '../../internal/temporalLimits'
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
import { NumberSign, bindArgs, mapProps } from '../../internal/utils'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike } from '../commonTypes'
import { PlainDateTimeRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainDateTimeSlots,
  getPlainTimeSlotsIfPresent,
  setPlainDateTimeSlots,
} from '../temporalRecords'
import {
  createShimCalendarStringResolver,
  getCalendarRecordImpl,
  refineShimCalendarArgMaybe,
} from './calendarResolve'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import {
  adaptRecordTimeUnitDiff,
  diffPlainDateTimeEpochNanoTimeUnit,
  diffPlainDateTimeMonths,
  diffPlainDateTimeYears,
  diffPlainDays,
  diffPlainWeeks,
} from './diffUtils'
import {
  ShimDurationRecord,
  createShimDurationRecord,
  getShimDurationSlots,
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
import { ShimPlainDateRecord, createShimPlainDateRecord } from './plainDate'
import type { ShimPlainTimeRecord } from './plainTime'
import { createShimPlainTimeRecord } from './plainTime'
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
import { validateBag } from './temporalRecords'
import {
  ShimZonedDateTimeRecord,
  createShimZonedDateTimeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<ShimPlainDateTimeRecord>
type ShimPlainDateTimeSlots = CalendarDateTimeFields & {
  calendar: CalendarImpl
}

export const getShimPlainDateTimeSlots: (
  record: unknown,
) => ShimPlainDateTimeSlots = getPlainDateTimeSlots

export type ShimPlainDateTimeRecord = InstanceType<
  typeof ShimPlainDateTimeRecord
> &
  RecordTypes.PlainDateTimeRecord

export const ShimPlainDateTimeRecord = defineTemporalClass(
  PlainDateTimeRecordBranding,
  class {
    declare readonly [RecordTypes.PlainDateTimeRecordBrand]: undefined

    get calendarId() {
      return getCalendarSlotId(getShimPlainDateTimeSlots(this).calendar)
    }

    toJSON() {
      return formatDateTimeIsoAuto(getShimPlainDateTimeSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  getShimPlainDateTimeSlots,
  dateFieldGetters,
  timeGetters,
)

export function createShimPlainDateTimeRecord(
  slots: ShimPlainDateTimeSlots,
): ShimPlainDateTimeRecord {
  const instance = Object.create(ShimPlainDateTimeRecord.prototype)
  setPlainDateTimeSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  microsecond = 0,
  nanosecond = 0,
  calendar?: CalendarRecord,
): ShimPlainDateTimeRecord {
  const fields = checkIsoDateTimeInBounds(
    validateIsoDateTimeFields(
      mapProps(toIntegerWithTrunc, {
        year: isoYear,
        month: isoMonth,
        day: isoDay,
        hour,
        minute,
        second,
        millisecond,
        microsecond,
        nanosecond,
      }),
    ),
  )
  const calendarImpl = refineShimCalendarArgMaybe(calendar)
  return createShimPlainDateTimeRecord(
    createDateTimeSlots(fields, calendarImpl),
  )
}

export function fromFields(
  fields: Partial<DateTimeFields & { calendar: CalendarRecord }>,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const calendarImpl = refineShimCalendarArgMaybe(fields.calendar)
  const resSlots = refinePlainDateTimeObjectLike(calendarImpl, fields, options)
  return createShimPlainDateTimeRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): ShimPlainDateTimeRecord {
  return createShimPlainDateTimeRecord(
    parsePlainDateTime(s, createShimCalendarStringResolver(getCalendarRecord)),
  )
}

export function withCalendar(
  record: ShimPlainDateTimeRecord,
  inputCalendar: CalendarRecord,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const calendarImpl = getCalendarRecordImpl(inputCalendar)
  return createShimPlainDateTimeRecord(createDateTimeSlots(slots, calendarImpl))
}

export function withFields(
  record: ShimPlainDateTimeRecord,
  mod: Partial<DateTimeFields>,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const resSlots = mergePlainDateTimeFields(slots, validateBag(mod), options)
  return createShimPlainDateTimeRecord(resSlots)
}

export function withPlainTime(
  record: ShimPlainDateTimeRecord,
  plainTimeRecord: ShimPlainTimeRecord | TimeFields = timeFieldDefaults,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const timeFields =
    getPlainTimeSlotsIfPresent<TimeFields>(plainTimeRecord) || plainTimeRecord
  const resSlots = createPlainDateTimeFromRefinedFields(
    slots,
    timeFields,
    slots.calendar,
  )
  return createShimPlainDateTimeRecord(resSlots)
}

export function dayOfWeek(record: ShimPlainDateTimeRecord): number {
  return computeIsoDayOfWeek(getShimPlainDateTimeSlots(record))
}

export function daysInWeek(record: ShimPlainDateTimeRecord): number {
  getShimPlainDateTimeSlots(record)
  return 7
}

export function weekOfYear(
  record: ShimPlainDateTimeRecord,
): number | undefined {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(
  record: ShimPlainDateTimeRecord,
): number | undefined {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function dayOfYear(record: ShimPlainDateTimeRecord): number {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function daysInMonth(record: ShimPlainDateTimeRecord): number {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: ShimPlainDateTimeRecord): number {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: ShimPlainDateTimeRecord): number {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: ShimPlainDateTimeRecord): boolean {
  const slots = getShimPlainDateTimeSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function add(
  record: ShimPlainDateTimeRecord,
  durationRecord: ShimDurationRecord,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createDateTimeSlots(
    moveDateTime(slots.calendar, slots, durationSlots, options),
    slots.calendar,
  )
  return createShimPlainDateTimeRecord(resSlots)
}

export function subtract(
  record: ShimPlainDateTimeRecord,
  durationRecord: ShimDurationRecord,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createDateTimeSlots(
    moveDateTime(
      slots.calendar,
      slots,
      negateDurationFields(durationSlots),
      options,
    ),
    slots.calendar,
  )
  return createShimPlainDateTimeRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimPlainDateTimeRecord,
  otherRecord: ShimPlainDateTimeRecord,
  options?: TemporalSpec.RoundingOptionsWithLargestUnit<
    TemporalSpec.DateUnit | TemporalSpec.TimeUnit
  >,
): ShimDurationRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const otherSlots = getShimPlainDateTimeSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDateTimes(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createShimDurationRecord(resSlots)
}

export function equals(
  record: ShimPlainDateTimeRecord,
  otherRecord: ShimPlainDateTimeRecord,
): boolean {
  const slots = getShimPlainDateTimeSlots(record)
  const otherSlots = getShimPlainDateTimeSlots(otherRecord)
  return plainDateTimesEqual(slots, otherSlots)
}

export function compare(
  record: ShimPlainDateTimeRecord,
  otherRecord: ShimPlainDateTimeRecord,
): NumberSign {
  const slots = getShimPlainDateTimeSlots(record)
  const otherSlots = getShimPlainDateTimeSlots(otherRecord)
  return compareIsoDateTimeFields(slots, otherSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<ShimPlainDateTimeRecord>(
  (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getShimPlainDateTimeSlots(record)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots)
      return [format, isoDateTimeToEpochMilli(slots)]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getShimPlainDateTimeSlots(record0)
      const slots1 = getShimPlainDateTimeSlots(record1)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots0)
      checkResolvedCalendarCompatible(format, slots1)
      return [
        format,
        isoDateTimeToEpochMilli(slots0),
        isoDateTimeToEpochMilli(slots1),
      ]
    },
  }),
  (options) =>
    applyPlainFormatTimeZone(
      transformDateTimeOptions(options, /* allowPartialOverlap = */ true),
    ),
)

export function toLocaleString(
  record: ShimPlainDateTimeRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimPlainDateTimeSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(transformDateTimeOptions(options)),
  )
  checkResolvedCalendarCompatible(format, slots)
  return format.format(isoDateTimeToEpochMilli(slots))
}

export function toString(
  record: ShimPlainDateTimeRecord,
  options?: TemporalSpec.PlainDateTimeToStringOptions,
): string {
  return formatPlainDateTimeIso(getShimPlainDateTimeSlots(record), options)
}

export function toBasicString(record: ShimPlainDateTimeRecord): string {
  return formatDateTimeIsoAuto(getShimPlainDateTimeSlots(record))
}

export function toZonedDateTime(
  record: ShimPlainDateTimeRecord,
  timeZoneId: string,
  options?: TemporalSpec.DisambiguationOptions,
): ShimZonedDateTimeRecord {
  const resSlots = plainDateTimeToZonedDateTime(
    getShimPlainDateTimeSlots(record),
    queryTimeZone(refineTimeZoneId(timeZoneId)),
    options,
  )
  return createShimZonedDateTimeRecord(resSlots)
}

export function toPlainDate(
  record: ShimPlainDateTimeRecord,
): ShimPlainDateRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const resSlots = createDateSlots(slots, slots.calendar)
  return createShimPlainDateRecord(resSlots)
}

export function toPlainTime(
  record: ShimPlainDateTimeRecord,
): ShimPlainTimeRecord {
  const resSlots = createTimeSlots(getShimPlainDateTimeSlots(record))
  return createShimPlainTimeRecord(resSlots)
}

// Type the bare global `Temporal` value (module-scoped, NOT `declare global`,
// so it never leaks into a consumer's environment). Lets `toTemporal` build via
// `new Temporal.PlainDateTime(...)` — smaller than `globalThis.Temporal`, read lazily.
declare const Temporal: { PlainDateTime: TemporalSpec.PlainDateTimeConstructor }

export function toTemporal(
  record: ShimPlainDateTimeRecord,
): TemporalSpec.PlainDateTime {
  const slots = getShimPlainDateTimeSlots(record)
  return new Temporal.PlainDateTime(
    slots.year,
    slots.month,
    slots.day,
    slots.hour,
    slots.minute,
    slots.second,
    slots.millisecond,
    slots.microsecond,
    slots.nanosecond,
    getCalendarSlotId(slots.calendar),
  )
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: ShimPlainDateTimeRecord,
  dayOfYear: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveToDayOfYear(slots.calendar, slots, dayOfYear, options),
      slots,
      slots.calendar,
    ),
  )
}

export function withDayOfMonth(
  record: ShimPlainDateTimeRecord,
  dayOfMonth: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveToDayOfMonth(slots.calendar, slots, dayOfMonth, options),
      slots,
      slots.calendar,
    ),
  )
}

export function withDayOfWeek(
  record: ShimPlainDateTimeRecord,
  dayOfWeek: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveToDayOfWeek(slots.calendar, slots, dayOfWeek, options),
      slots,
      slots.calendar,
    ),
  )
}

export function withWeekOfYear(
  record: ShimPlainDateTimeRecord,
  weekOfYear: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveToWeekOfYear(slots.calendar, slots, weekOfYear, options),
      slots,
      slots.calendar,
    ),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: ShimPlainDateTimeRecord,
  years: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveByYears(slots.calendar, slots, years, options),
      slots,
      slots.calendar,
    ),
  )
}

export function addMonths(
  record: ShimPlainDateTimeRecord,
  months: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveByMonths(slots.calendar, slots, months, options),
      slots,
      slots.calendar,
    ),
  )
}

export function addWeeks(
  record: ShimPlainDateTimeRecord,
  weeks: number,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveByIsoWeeks(slots.calendar, slots, weeks),
      slots,
      slots.calendar,
    ),
  )
}

export function addDays(
  record: ShimPlainDateTimeRecord,
  days: number,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      moveByDaysStrict(slots.calendar, slots, days),
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
  record: ShimPlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  // We already hold smallestUnit as a separate arg, so refine the options
  // directly instead of synthesizing a raw options bag for re-parsing.
  const [roundingInc, roundingMode] = refineRoundToOptions(
    smallestUnit,
    options,
  )
  return createShimPlainDateTimeRecord(
    createDateTimeSlots(
      roundDateTimeToNano(
        slots,
        computeNanoInc(smallestUnit, roundingInc),
        roundingMode,
      ),
      slots.calendar,
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
  record0: ShimPlainDateTimeRecord,
  record1: ShimPlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateTimeYears(
    getShimPlainDateTimeSlots(record0),
    getShimPlainDateTimeSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: ShimPlainDateTimeRecord,
  record1: ShimPlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateTimeMonths(
    getShimPlainDateTimeSlots(record0),
    getShimPlainDateTimeSlots(record1),
    options,
  )
}

export function diffWeeks(
  record0: ShimPlainDateTimeRecord,
  record1: ShimPlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainWeeks(
    getShimPlainDateTimeSlots(record0),
    getShimPlainDateTimeSlots(record1),
    options,
  )
}

export function diffDays(
  record0: ShimPlainDateTimeRecord,
  record1: ShimPlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDays(
    getShimPlainDateTimeSlots(record0),
    getShimPlainDateTimeSlots(record1),
    options,
  )
}

const diffRecordTimeUnit = adaptRecordTimeUnitDiff<
  ShimPlainDateTimeRecord,
  ShimPlainDateTimeSlots
>(diffPlainDateTimeEpochNanoTimeUnit, getShimPlainDateTimeSlots)

export const diffHours = bindArgs(diffRecordTimeUnit, Unit.Hour, nanoInHour)
export const diffMinutes = bindArgs(
  diffRecordTimeUnit,
  Unit.Minute,
  nanoInMinute,
)
export const diffSeconds = bindArgs(diffRecordTimeUnit, Unit.Second, nanoInSec)
export const diffMilliseconds = bindArgs(
  diffRecordTimeUnit,
  Unit.Millisecond,
  nanoInMilli,
)
export const diffMicroseconds = bindArgs(
  diffRecordTimeUnit,
  Unit.Microsecond,
  nanoInMicro,
)
export const diffNanoseconds = bindArgs(diffRecordTimeUnit, Unit.Nanosecond, 1)

function moveByTimeUnit(
  nanoInUnit: number,
  record: ShimPlainDateTimeRecord,
  units: number,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const epochNano0 = isoDateTimeToEpochNano(slots)
  const epochNano1 =
    epochNano0 + BigInt(toStrictInteger(units)) * BigInt(nanoInUnit)
  const isoDateTime1 = epochNanoToIsoDateTime(epochNano1)
  return createShimPlainDateTimeRecord(
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
    calendar: CalendarImpl,
    slots: CalendarDateTimeFields,
  ) => IsoDateTimeInterval,
  record: ShimPlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateTimeSlots(record)
  const [, roundingMode] = refineRoundToOptions(unit, options)
  const isoDateTime = roundDateTimeToInterval(
    computeInterval,
    slots.calendar,
    slots,
    roundingMode,
  )
  return createShimPlainDateTimeRecord(
    createPlainDateTimeFromRefinedFields(
      isoDateTime,
      isoDateTime,
      slots.calendar,
    ),
  )
}

function aligned(
  computeAlignment: (
    calendar: CalendarImpl,
    slots: CalendarDateTimeFields,
  ) => CalendarDateTimeFields,
  nanoDelta = 0,
): (record: ShimPlainDateTimeRecord) => ShimPlainDateTimeRecord {
  return (record) => {
    const slots = getShimPlainDateTimeSlots(record)
    let isoDateTime = computeAlignment(slots.calendar, slots)

    if (nanoDelta) {
      isoDateTime = epochNanoToIsoDateTime(
        isoDateTimeToEpochNano(isoDateTime) + BigInt(nanoDelta),
      )
    }

    return createShimPlainDateTimeRecord(
      createPlainDateTimeFromRefinedFields(
        isoDateTime,
        isoDateTime,
        slots.calendar,
      ),
    )
  }
}

function alignedDateTimeStart(
  computeAlignment: (slots: ShimPlainDateTimeSlots) => CalendarDateTimeFields,
): (record: ShimPlainDateTimeRecord) => ShimPlainDateTimeRecord {
  return (record) => {
    const slots = getShimPlainDateTimeSlots(record)
    // DateTime starts at or below the day unit only clear time fields on an
    // already-valid PlainDateTime. The ISO date is unchanged, so no bounds
    // check is needed.
    return createShimPlainDateTimeRecord(
      createDateTimeSlots(computeAlignment(slots), slots.calendar),
    )
  }
}

function alignedTimeStart(
  computeAlignment: (time: TimeFields) => TimeFields,
): (record: ShimPlainDateTimeRecord) => ShimPlainDateTimeRecord {
  return (record) => {
    const slots = getShimPlainDateTimeSlots(record)
    // Time floors only zero sub-hour/minute/etc. fields on an already-valid
    // PlainDateTime. The ISO date is unchanged, so no bounds check is needed.
    return createShimPlainDateTimeRecord(
      createDateTimeSlots(
        combineDateAndTime(slots, computeAlignment(slots)),
        slots.calendar,
      ),
    )
  }
}

function alignedTimeEnd(
  computeAlignment: (time: TimeFields) => TimeFields,
): (record: ShimPlainDateTimeRecord) => ShimPlainDateTimeRecord {
  return (record) => {
    const slots = getShimPlainDateTimeSlots(record)
    // Time ceilings at or below the day unit only set fields within an
    // already-valid PlainDateTime. The ISO date is unchanged, so no epoch math
    // or bounds check is needed.
    return createShimPlainDateTimeRecord(
      createDateTimeSlots(
        combineDateAndTime(slots, computeAlignment(slots)),
        slots.calendar,
      ),
    )
  }
}
