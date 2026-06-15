import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { ZonedDateTimeBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { calendarFieldGetters, timeGetters } from '../../apiHelpers/mixins'
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
import { toBigInt, toStrictInteger } from '../../internal/cast'
import {
  compareZonedDateTimes,
  zonedDateTimesEqual,
} from '../../internal/compare'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../../internal/convert'
import { refineZonedDateTimeObjectLike } from '../../internal/createFromFields'
import { diffZonedDateTimes } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import {
  applyZonedFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformZonedOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
  formatZonedDateTimeIsoAuto,
} from '../../internal/isoFormat'
import { parseZonedDateTime } from '../../internal/isoParse'
import { mergeZonedDateTimeFields } from '../../internal/merge'
import { zonedDateTimeWithPlainTime } from '../../internal/modify'
import { moveZonedEpochSlots } from '../../internal/move'
import { EpochDisambig, OffsetDisambig } from '../../internal/optionsModel'
import {
  IsoDateTimeInterval,
  alignZonedEpoch,
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedEpochSlotsToUnit,
  roundZonedEpochToInterval,
} from '../../internal/round'
import { getCommonCalendar, getZonedTimeZoneId } from '../../internal/slotUtils'
import {
  ZonedEpochNanoFields,
  createZonedEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { checkEpochNanoInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import {
  getMatchingInstantFor,
  getSingleInstantFor,
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
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
import { CalendarRecord } from '../calendarRecord'
import { ZonedDateTimeFields } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getZonedDateTimeSlots,
  setZonedDateTimeSlots,
} from '../temporalRecords'
import {
  createShimCalendarStringResolver,
  getCalendarRecordImpl,
  refineShimCalendarArgMaybe,
} from './calendarResolve'
import {
  adaptRecordTimeUnitDiff,
  diffZonedDays,
  diffZonedEpochNanoTimeUnit,
  diffZonedMonths,
  diffZonedWeeks,
  diffZonedYears,
} from './diffUtils'
import {
  ShimDurationRecord,
  createShimDurationRecord,
  getShimDurationSlots,
} from './duration'
import { ShimInstantRecord, createShimInstantRecord } from './instant'
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
import {
  ShimPlainDateTimeRecord,
  createShimPlainDateTimeRecord,
} from './plainDateTime'
import {
  ShimPlainTimeRecord,
  createShimPlainTimeRecord,
  getShimPlainTimeSlots,
} from './plainTime'
import { refineRoundToOptions } from './roundUtils'
import {
  computeDayCeil,
  computeIsoWeekCeil,
  computeIsoWeekFloor,
  computeIsoWeekInterval,
  computeMonthCeil,
  computeMonthFloor,
  computeMonthInterval,
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
} from './roundUtils'
import { validateBag } from './temporalRecords'

type ShimZonedDateTimeFields = ZonedDateTimeFields<CalendarRecord>
type ShimZonedDateTimeSlots = ZonedEpochNanoFields & { calendar: CalendarImpl }

export const getShimZonedDateTimeSlots: (
  record: unknown,
) => ShimZonedDateTimeSlots = getZonedDateTimeSlots

export type ShimZonedDateTimeRecord = InstanceType<
  typeof ShimZonedDateTimeRecord
> &
  RecordTypes.ZonedDateTimeRecord
export const ShimZonedDateTimeRecord = defineTemporalClass(
  ZonedDateTimeBranding,
  class {
    declare readonly [RecordTypes.ZonedDateTimeRecordBrand]: undefined

    get calendarId() {
      return getCalendarSlotId(getShimZonedDateTimeSlots(this).calendar)
    }

    get epochMilliseconds() {
      return getEpochMilli(getShimZonedDateTimeSlots(this))
    }

    get epochNanoseconds() {
      return getEpochNano(getShimZonedDateTimeSlots(this))
    }

    get timeZoneId() {
      return getShimZonedDateTimeSlots(this).timeZone.id
    }

    toJSON() {
      return formatZonedDateTimeIsoAuto(getShimZonedDateTimeSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  getShimZonedDateTimeIsoSlots,
  calendarFieldGetters,
  timeGetters,
)

export function createShimZonedDateTimeRecord(
  slots: ShimZonedDateTimeSlots,
): ShimZonedDateTimeRecord {
  const instance = Object.create(ShimZonedDateTimeRecord.prototype)
  setZonedDateTimeSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

function getShimZonedDateTimeIsoSlots(
  record: unknown,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const slots = getShimZonedDateTimeSlots(record)
  return { ...zonedEpochSlotsToIso(slots), calendar: slots.calendar }
}

export function create(
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: CalendarRecord,
): ShimZonedDateTimeRecord {
  const epochNano = checkEpochNanoInBounds(toBigInt(epochNanoseconds))
  const timeZone = queryTimeZone(refineTimeZoneId(timeZoneId))
  const calendarImpl = refineShimCalendarArgMaybe(calendar)
  return createShimZonedDateTimeRecord(
    createZonedEpochNanoSlots(epochNano, timeZone, calendarImpl),
  )
}

export function fromFields(
  fields: ShimZonedDateTimeFields,
  options?: Temporal.ZonedDateTimeFromOptions,
): ShimZonedDateTimeRecord {
  const inputCalendar = fields.calendar
  const calendarImpl = refineShimCalendarArgMaybe(inputCalendar)
  const resSlots = refineZonedDateTimeObjectLike(
    refineTimeZoneId,
    calendarImpl,
    fields as any,
    options,
  )
  return createShimZonedDateTimeRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
  options?: Temporal.ZonedDateTimeFromOptions,
): ShimZonedDateTimeRecord {
  return createShimZonedDateTimeRecord(
    parseZonedDateTime(
      s,
      createShimCalendarStringResolver(getCalendarRecord),
      options,
    ),
  )
}

export function withFields(
  record: ShimZonedDateTimeRecord,
  mod: Partial<DateTimeFields>,
  options?: Temporal.ZonedDateTimeFromOptions,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const resSlots = mergeZonedDateTimeFields(slots, validateBag(mod), options)
  return createShimZonedDateTimeRecord(resSlots)
}

export function withCalendar(
  record: ShimZonedDateTimeRecord,
  inputCalendar: CalendarRecord,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const calendarImpl = getCalendarRecordImpl(inputCalendar)
  return createShimZonedDateTimeRecord(
    createZonedEpochNanoSlots(
      slots.epochNanoseconds,
      slots.timeZone,
      calendarImpl,
    ),
  )
}

export function withTimeZone(
  record: ShimZonedDateTimeRecord,
  timeZoneId: string,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  return createShimZonedDateTimeRecord(
    createZonedEpochNanoSlots(
      slots.epochNanoseconds,
      queryTimeZone(refineTimeZoneId(timeZoneId)),
      slots.calendar,
    ),
  )
}

export function withPlainTime(
  record: ShimZonedDateTimeRecord,
  plainTimeRecord?: ShimPlainTimeRecord,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const plainTimeSlots =
    plainTimeRecord === undefined
      ? undefined
      : getShimPlainTimeSlots(plainTimeRecord)
  const resSlots = zonedDateTimeWithPlainTime(slots, plainTimeSlots)
  return createShimZonedDateTimeRecord(resSlots)
}

export function offsetNanoseconds(record: ShimZonedDateTimeRecord): number {
  return zonedEpochSlotsToIso(getShimZonedDateTimeSlots(record))
    .offsetNanoseconds
}

export function offset(record: ShimZonedDateTimeRecord): string {
  return formatOffsetNano(offsetNanoseconds(record))
}

export function dayOfWeek(record: ShimZonedDateTimeRecord): number {
  return computeIsoDayOfWeek(
    zonedEpochSlotsToIso(getShimZonedDateTimeSlots(record)),
  )
}

export function daysInWeek(record: ShimZonedDateTimeRecord): number {
  getShimZonedDateTimeSlots(record)
  return 7
}

export function weekOfYear(
  record: ShimZonedDateTimeRecord,
): number | undefined {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(
  record: ShimZonedDateTimeRecord,
): number | undefined {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function dayOfYear(record: ShimZonedDateTimeRecord): number {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function daysInMonth(record: ShimZonedDateTimeRecord): number {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: ShimZonedDateTimeRecord): number {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: ShimZonedDateTimeRecord): number {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: ShimZonedDateTimeRecord): boolean {
  const slots = getShimZonedDateTimeIsoSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function hoursInDay(record: ShimZonedDateTimeRecord): number {
  return computeZonedHoursInDay(getShimZonedDateTimeSlots(record))
}

export function toString(
  record: ShimZonedDateTimeRecord,
  options?: Temporal.ZonedDateTimeToStringOptions,
): string {
  return formatZonedDateTimeIso(getShimZonedDateTimeSlots(record), options)
}

export function toBasicString(record: ShimZonedDateTimeRecord): string {
  return formatZonedDateTimeIsoAuto(getShimZonedDateTimeSlots(record))
}

export function add(
  record: ShimZonedDateTimeRecord,
  durationRecord: ShimDurationRecord,
  options?: Temporal.OverflowOptions,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = moveZonedEpochSlots(
    slots,
    durationSlots,
    options === undefined ? Object.create(null) : options,
  )
  return createShimZonedDateTimeRecord(resSlots)
}

export function subtract(
  record: ShimZonedDateTimeRecord,
  durationRecord: ShimDurationRecord,
  options?: Temporal.OverflowOptions,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = moveZonedEpochSlots(
    slots,
    negateDurationFields(durationSlots),
    options === undefined ? Object.create(null) : options,
  )
  return createShimZonedDateTimeRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimZonedDateTimeRecord,
  otherRecord: ShimZonedDateTimeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): ShimDurationRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const otherSlots = getShimZonedDateTimeSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffZonedDateTimes(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createShimDurationRecord(resSlots)
}

export function startOfDay(
  record: ShimZonedDateTimeRecord,
): ShimZonedDateTimeRecord {
  return createShimZonedDateTimeRecord(
    computeZonedStartOfDay(getShimZonedDateTimeSlots(record)),
  )
}

export function getTimeZoneTransition(
  record: ShimZonedDateTimeRecord,
  options: Temporal.TransitionOptions | Temporal.TransitionOptions['direction'],
): ShimZonedDateTimeRecord | null {
  const slots = getShimZonedDateTimeSlots(record)
  const epochNanoseconds = getTimeZoneTransitionEpochNanoseconds(slots, options)
  return epochNanoseconds
    ? createShimZonedDateTimeRecord({ ...slots, epochNanoseconds })
    : null
}

export function equals(
  record: ShimZonedDateTimeRecord,
  otherRecord: ShimZonedDateTimeRecord,
): boolean {
  const slots = getShimZonedDateTimeSlots(record)
  const otherSlots = getShimZonedDateTimeSlots(otherRecord)
  return zonedDateTimesEqual(slots, otherSlots)
}

export function compare(
  record: ShimZonedDateTimeRecord,
  otherRecord: ShimZonedDateTimeRecord,
): NumberSign {
  const slots = getShimZonedDateTimeSlots(record)
  const otherSlots = getShimZonedDateTimeSlots(otherRecord)
  return compareZonedDateTimes(slots, otherSlots)
}

export function toInstant(record: ShimZonedDateTimeRecord): ShimInstantRecord {
  const resSlots = zonedDateTimeToInstant(getShimZonedDateTimeSlots(record))
  return createShimInstantRecord(resSlots)
}

export function toPlainDateTime(
  record: ShimZonedDateTimeRecord,
): ShimPlainDateTimeRecord {
  const resSlots = zonedDateTimeToPlainDateTime(
    getShimZonedDateTimeSlots(record),
  )
  return createShimPlainDateTimeRecord(resSlots)
}

export function toPlainDate(
  record: ShimZonedDateTimeRecord,
): ShimPlainDateRecord {
  const resSlots = zonedDateTimeToPlainDate(getShimZonedDateTimeSlots(record))
  return createShimPlainDateRecord(resSlots)
}

export function toPlainTime(
  record: ShimZonedDateTimeRecord,
): ShimPlainTimeRecord {
  const resSlots = zonedDateTimeToPlainTime(getShimZonedDateTimeSlots(record))
  return createShimPlainTimeRecord(resSlots)
}

export function toLocaleString(
  record: ShimZonedDateTimeRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimZonedDateTimeSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyZonedFormatTimeZone(
      transformZonedOptions(options, /* allowPartialOverlap = */ false),
      getZonedTimeZoneId(slots),
    ),
  )
  checkResolvedCalendarCompatible(format, slots)
  return format.format(getEpochMilli(slots))
}

// Non-standard: With
// -----------------------------------------------------------------------------

export const withDayOfYear = zonedTransform(moveToDayOfYear)
export const withDayOfMonth = zonedTransform(moveToDayOfMonth)
export const withDayOfWeek = zonedTransform(moveToDayOfWeek)
export const withWeekOfYear = zonedTransform(moveToWeekOfYear)

// Non-standard: Move
// -----------------------------------------------------------------------------

export const addYears = zonedTransform(moveByYears)
export const addMonths = zonedTransform(moveByMonths)
export const addWeeks = zonedTransform(moveByIsoWeeks)
export const addDays = zonedTransform(moveByDaysStrict)
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
  record: ShimZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  // We already hold smallestUnit as a separate arg, so refine the options
  // directly instead of synthesizing a raw options bag for re-parsing.
  const [roundingInc, roundingMode] = refineRoundToOptions(
    smallestUnit,
    options,
  )
  return createShimZonedDateTimeRecord(
    roundZonedEpochSlotsToUnit(slots, smallestUnit, roundingInc, roundingMode),
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
export const startOfHour = alignedZonedTime((slots) => ({
  hour: slots.hour,
  minute: 0,
  second: 0,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfMinute = alignedZonedTime((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: 0,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfSecond = alignedZonedTime((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: 0,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfMillisecond = alignedZonedTime((slots) => ({
  hour: slots.hour,
  minute: slots.minute,
  second: slots.second,
  millisecond: slots.millisecond,
  microsecond: 0,
  nanosecond: 0,
}))
export const startOfMicrosecond = alignedZonedTime((slots) => ({
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
export const endOfDay = aligned(computeDayCeil, -1)
export const endOfHour = alignedZonedTime(
  (slots) => ({
    hour: slots.hour,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }),
  nanoInHour - 1,
)
export const endOfMinute = alignedZonedTime(
  (slots) => ({
    hour: slots.hour,
    minute: slots.minute,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }),
  nanoInMinute - 1,
)
export const endOfSecond = alignedZonedTime(
  (slots) => ({
    hour: slots.hour,
    minute: slots.minute,
    second: slots.second,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }),
  nanoInSec - 1,
)
export const endOfMillisecond = alignedZonedTime(
  (slots) => ({
    hour: slots.hour,
    minute: slots.minute,
    second: slots.second,
    millisecond: slots.millisecond,
    microsecond: 0,
    nanosecond: 0,
  }),
  nanoInMilli - 1,
)
export const endOfMicrosecond = alignedZonedTime(
  (slots) => ({
    hour: slots.hour,
    minute: slots.minute,
    second: slots.second,
    millisecond: slots.millisecond,
    microsecond: slots.microsecond,
    nanosecond: 0,
  }),
  nanoInMicro - 1,
)

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: ShimZonedDateTimeRecord,
  record1: ShimZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffZonedYears(
    getShimZonedDateTimeSlots(record0),
    getShimZonedDateTimeSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: ShimZonedDateTimeRecord,
  record1: ShimZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffZonedMonths(
    getShimZonedDateTimeSlots(record0),
    getShimZonedDateTimeSlots(record1),
    options,
  )
}

export function diffWeeks(
  record0: ShimZonedDateTimeRecord,
  record1: ShimZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffZonedWeeks(
    getShimZonedDateTimeSlots(record0),
    getShimZonedDateTimeSlots(record1),
    options,
  )
}

export function diffDays(
  record0: ShimZonedDateTimeRecord,
  record1: ShimZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffZonedDays(
    getShimZonedDateTimeSlots(record0),
    getShimZonedDateTimeSlots(record1),
    options,
  )
}

const diffRecordTimeUnit = adaptRecordTimeUnitDiff<
  ShimZonedDateTimeRecord,
  ShimZonedDateTimeSlots
>(diffZonedEpochNanoTimeUnit, getShimZonedDateTimeSlots)

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
  record: ShimZonedDateTimeRecord,
  units: number,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const epochNanoseconds =
    slots.epochNanoseconds + BigInt(toStrictInteger(units)) * BigInt(nanoInUnit)
  return createShimZonedDateTimeRecord({
    ...slots,
    epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
  })
}

function roundToInterval(
  unit: Unit,
  computeInterval: (
    calendar: CalendarImpl,
    slots: CalendarDateTimeFields,
  ) => IsoDateTimeInterval,
  record: ShimZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimZonedDateTimeRecord {
  const slots = getShimZonedDateTimeSlots(record)
  const [, roundingMode] = refineRoundToOptions(unit, options)
  const epochNanoseconds = roundZonedEpochToInterval(
    computeInterval,
    slots,
    roundingMode,
  )
  return createShimZonedDateTimeRecord({
    ...slots,
    epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
  })
}

function aligned(
  computeAlignment: (
    calendar: CalendarImpl,
    record: CalendarDateTimeFields,
  ) => CalendarDateTimeFields,
  nanoDelta = 0,
): (record: ShimZonedDateTimeRecord) => ShimZonedDateTimeRecord {
  return (record) => {
    const slots = getShimZonedDateTimeSlots(record)
    const epochNanoseconds =
      alignZonedEpoch(computeAlignment, slots) + BigInt(nanoDelta)
    return createShimZonedDateTimeRecord({
      ...slots,
      epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
    })
  }
}

function alignedZonedTime(
  computeAlignment: (time: TimeFields) => TimeFields,
  nanoDelta = 0,
): (record: ShimZonedDateTimeRecord) => ShimZonedDateTimeRecord {
  return (record) => {
    const slots = getShimZonedDateTimeSlots(record)
    const { timeZone } = slots
    const isoDateTime = zonedEpochSlotsToIso(slots)

    // Sub-day alignment is wall-clock alignment, not exact-time subtraction.
    // Transitions can happen inside an hour/minute/etc, so subtracting the
    // apparent wall-clock remainder would cross gaps/repeats incorrectly.
    const alignedIsoDateTime = combineDateAndTime(
      isoDateTime,
      computeAlignment(isoDateTime),
    )

    // If the aligned wall time is repeated, prefer the current offset so
    // 01:30-05:00 startOfHour stays in the second 01:00 hour. If the aligned
    // wall time is skipped, compatible disambiguation still moves forward.
    const epochNanoseconds =
      getMatchingInstantFor(
        timeZone,
        alignedIsoDateTime,
        isoDateTime.offsetNanoseconds,
        OffsetDisambig.Prefer,
        EpochDisambig.Compat,
        true,
      ) + BigInt(nanoDelta)

    return createShimZonedDateTimeRecord({
      ...slots,
      epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
    })
  }
}

function zonedTransform<A extends any[]>(
  transformIsoDate: (
    calendar: CalendarImpl,
    isoDate: CalendarDateFields,
    ...args: A
  ) => CalendarDateFields,
): (record: ShimZonedDateTimeRecord, ...args: A) => ShimZonedDateTimeRecord {
  return (record, ...args) => {
    const slots = getShimZonedDateTimeSlots(record)
    const { calendar, timeZone } = slots
    const isoDateTime = zonedEpochSlotsToIso(slots)
    const isoDate = transformIsoDate(calendar, isoDateTime, ...args)

    // These transforms are date-only operations. Preserve the original
    // wall-clock time while allowing the transform to replace the ISO date.
    const epochNanoseconds = getSingleInstantFor(
      timeZone,
      combineDateAndTime(isoDate, isoDateTime),
    )

    return createShimZonedDateTimeRecord({
      ...slots,
      epochNanoseconds: checkEpochNanoInBounds(epochNanoseconds),
    })
  }
}
