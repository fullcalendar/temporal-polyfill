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
import {
  type CalendarImpl,
  getCalendarSlotId,
} from '../../internal/calendarImpl'
import { compareIsoDateFields, plainDatesEqual } from '../../internal/compare'
import { constructDateSlots } from '../../internal/construct'
import { plainDateToZonedDateTime } from '../../internal/convert'
import { refinePlainDateObjectLike } from '../../internal/createFromFields'
import { diffPlainDates } from '../../internal/diff'
import {
  isoDateToEpochDays,
  isoDateToEpochMilli,
} from '../../internal/epochMath'
import { timeFieldDefaults } from '../../internal/fieldNames'
import {
  CalendarDateFields,
  DateFields,
  TimeFields,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformDateOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatDateIsoAuto, formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { mergePlainDateFields } from '../../internal/merge'
import { moveByDays, movePlainDate } from '../../internal/move'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import { IsoDateTimeInterval, roundNumberToInc } from '../../internal/round'
import { getCommonCalendar } from '../../internal/slotUtils'
import { createDateSlots } from '../../internal/slots'
import {
  createPlainDateTimeFromRefinedFields,
  createPlainMonthDayFromFields,
  createPlainYearMonthFromFields,
} from '../../internal/slotsFromRefinedFields'
import { checkIsoDateInBounds } from '../../internal/temporalLimits'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { Unit } from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import { CalendarRecord } from '../calendarRecord'
import {
  DateTimeFormatLike,
  PlainDateToZonedDateTimeOptions,
} from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainDateSlots,
  getPlainTimeSlots,
  getPlainTimeSlotsIfPresent,
  setPlainDateSlots,
} from '../temporalRecords'
import {
  createShimCalendarStringResolver,
  getCalendarRecordImpl,
  refineShimCalendarArgMaybe,
} from './calendarResolve'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import { diffPlainMonths, diffPlainYears } from './diffUtils'
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
import {
  ShimPlainDateTimeRecord,
  createShimPlainDateTimeRecord,
} from './plainDateTime'
import {
  ShimPlainMonthDayRecord,
  createShimPlainMonthDayRecord,
} from './plainMonthDay'
import type { ShimPlainTimeRecord } from './plainTime'
import {
  ShimPlainYearMonthRecord,
  createShimPlainYearMonthRecord,
} from './plainYearMonth'
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
  roundDateToInterval,
} from './roundUtils'
import { rejectInvalidBag } from './temporalRecords'
import {
  ShimZonedDateTimeRecord,
  createShimZonedDateTimeRecord,
} from './zonedDateTime'

type PlainDateRecord = RecordTypes.PlainDateRecord

type Format = DateTimeFormatLike<ShimPlainDateRecord>

type ShimPlainDateSlots = ReturnType<typeof constructDateSlots>

export const getShimPlainDateSlots: (record: unknown) => ShimPlainDateSlots =
  getPlainDateSlots

class _ShimPlainDateRecord implements DateFields, PlainDateRecord {
  declare readonly [RecordTypes.PlainDateRecordBrand]: undefined

  get calendarId() {
    return getCalendarSlotId(getShimPlainDateSlots(this).calendar)
  }

  get era() {
    const slots = getShimPlainDateSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear() {
    const slots = getShimPlainDateSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year() {
    const slots = getShimPlainDateSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month() {
    const slots = getShimPlainDateSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode() {
    const slots = getShimPlainDateSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day() {
    const slots = getShimPlainDateSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  toJSON() {
    return formatDateIsoAuto(getShimPlainDateSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

export function createShimPlainDateRecord(
  slots: ShimPlainDateSlots,
): ShimPlainDateRecord {
  const instance = Object.create(ShimPlainDateRecord.prototype)
  setPlainDateSlots(instance, slots)
  attachDebugString(instance, slots, formatDateIsoAuto)
  return instance
}

export type ShimPlainDateRecord = _ShimPlainDateRecord
export const ShimPlainDateRecord = defineTemporalClass(
  _ShimPlainDateRecord,
  'PlainDate',
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
): ShimPlainDateRecord {
  return createShimPlainDateRecord(
    constructDateSlots(
      refineShimCalendarArgMaybe,
      isoYear,
      isoMonth,
      isoDay,
      calendar,
    ),
  )
}

export function fromFields(
  fields: Partial<DateFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  const calendarImpl = refineShimCalendarArgMaybe(fields.calendar)
  const resSlots = refinePlainDateObjectLike(calendarImpl, fields, options)
  return createShimPlainDateRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): ShimPlainDateRecord {
  return createShimPlainDateRecord(
    parsePlainDate(s, createShimCalendarStringResolver(getCalendarRecord)),
  )
}

export function withCalendar(
  record: ShimPlainDateRecord,
  inputCalendar: CalendarRecord,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  const calendarImpl = getCalendarRecordImpl(inputCalendar)
  return createShimPlainDateRecord(createDateSlots(slots, calendarImpl))
}

export function withFields(
  record: ShimPlainDateRecord,
  mod: Partial<DateFields>,
  options?: Temporal.OverflowOptions,
) {
  const slots = getShimPlainDateSlots(record)
  const resSlots = mergePlainDateFields(slots, rejectInvalidBag(mod), options)
  return createShimPlainDateRecord(resSlots)
}

export function dayOfYear(record: ShimPlainDateRecord) {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function dayOfWeek(record: ShimPlainDateRecord): number {
  return computeIsoDayOfWeek(getShimPlainDateSlots(record))
}

export function daysInWeek(record: ShimPlainDateRecord): number {
  getShimPlainDateSlots(record)
  return 7
}

export function weekOfYear(record: ShimPlainDateRecord): number | undefined {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(record: ShimPlainDateRecord): number | undefined {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function daysInMonth(record: ShimPlainDateRecord): number {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: ShimPlainDateRecord): number {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: ShimPlainDateRecord): number {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: ShimPlainDateRecord): boolean {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function add(
  record: ShimPlainDateRecord,
  durationRecord: any,
  options?: Temporal.OverflowOptions,
) {
  const slots = getShimPlainDateSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = movePlainDate(false, slots, durationSlots, options)
  return createShimPlainDateRecord(resSlots)
}

export function subtract(
  record: ShimPlainDateRecord,
  durationRecord: any,
  options?: Temporal.OverflowOptions,
) {
  const slots = getShimPlainDateSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = movePlainDate(true, slots, durationSlots, options)
  return createShimPlainDateRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimPlainDateRecord,
  otherRecord: ShimPlainDateRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>,
): ShimDurationRecord {
  const slots = getShimPlainDateSlots(record)
  const otherSlots = getShimPlainDateSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDates(false, calendar, slots, otherSlots, options)
  return createShimDurationRecord(resSlots)
}

export function equals(
  record: ShimPlainDateRecord,
  otherRecord: ShimPlainDateRecord,
): boolean {
  const slots = getShimPlainDateSlots(record)
  const otherSlots = getShimPlainDateSlots(otherRecord)
  return plainDatesEqual(slots, otherSlots)
}

export function compare(
  record: ShimPlainDateRecord,
  otherRecord: ShimPlainDateRecord,
): NumberSign {
  const slots = getShimPlainDateSlots(record)
  const otherSlots = getShimPlainDateSlots(otherRecord)
  return compareIsoDateFields(slots, otherSlots)
}

export function toZonedDateTime(
  record: ShimPlainDateRecord,
  options: string | PlainDateToZonedDateTimeOptions<ShimPlainTimeRecord>,
): ShimZonedDateTimeRecord {
  const optionsObj =
    typeof options === 'string' ? { timeZone: options } : options
  const resSlots = plainDateToZonedDateTime(
    refineTimeZoneId,
    getPlainTimeSlots,
    getShimPlainDateSlots(record),
    optionsObj,
  )
  return createShimZonedDateTimeRecord(resSlots)
}

export function toPlainDateTime(
  record: ShimPlainDateRecord,
  plainTimeRecord: ShimPlainTimeRecord | TimeFields = timeFieldDefaults,
): ShimPlainDateTimeRecord {
  const slots = getShimPlainDateSlots(record)
  const timeFields =
    getPlainTimeSlotsIfPresent<TimeFields>(plainTimeRecord) || plainTimeRecord
  const resSlots = createPlainDateTimeFromRefinedFields(
    slots,
    timeFields,
    slots.calendar,
  )
  return createShimPlainDateTimeRecord(resSlots)
}

export function toPlainYearMonth(
  record: ShimPlainDateRecord,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainDateSlots(record)
  const calendarDate = computeCalendarDateFields(slots.calendar, slots)
  const resSlots = createPlainYearMonthFromFields(slots.calendar, {
    year: calendarDate.year,
    monthCode: computeCalendarMonthCode(slots.calendar, slots),
  })
  return createShimPlainYearMonthRecord(resSlots)
}

export function toPlainMonthDay(
  record: ShimPlainDateRecord,
): ShimPlainMonthDayRecord {
  const slots = getShimPlainDateSlots(record)
  const calendarDate = computeCalendarDateFields(slots.calendar, slots)
  const resSlots = createPlainMonthDayFromFields(slots.calendar, {
    monthCode: computeCalendarMonthCode(slots.calendar, slots),
    day: calendarDate.day,
  })
  return createShimPlainMonthDayRecord(resSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<ShimPlainDateRecord>(
  (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getShimPlainDateSlots(record)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots)
      return [format, isoDateToEpochMilli(slots)]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getShimPlainDateSlots(record0)
      const slots1 = getShimPlainDateSlots(record1)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots0)
      checkResolvedCalendarCompatible(format, slots1)
      return [format, isoDateToEpochMilli(slots0), isoDateToEpochMilli(slots1)]
    },
  }),
  (options) =>
    applyPlainFormatTimeZone(
      transformDateOptions(options, /* allowPartialOverlap = */ true),
    ),
)

export function toLocaleString(
  record: ShimPlainDateRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimPlainDateSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(
      transformDateOptions(options, /* allowPartialOverlap = */ false),
    ),
  )
  checkResolvedCalendarCompatible(format, slots)
  return format.format(isoDateToEpochMilli(slots))
}

export function toString(
  record: ShimPlainDateRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return formatPlainDateIso(getShimPlainDateSlots(record), options)
}

export function toBasicString(record: ShimPlainDateRecord): string {
  return formatDateIsoAuto(getShimPlainDateSlots(record))
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: ShimPlainDateRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  return createRecordFromDateFields(
    moveToDayOfYear(getShimPlainDateSlots(record), dayOfYear, options),
  )
}

export function withDayOfMonth(
  record: ShimPlainDateRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  return createRecordFromDateFields(
    moveToDayOfMonth(getShimPlainDateSlots(record), dayOfMonth, options),
  )
}

export function withDayOfWeek(
  record: ShimPlainDateRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields({
    ...moveToDayOfWeek(slots, dayOfWeek, options),
    calendar: slots.calendar,
  })
}

export function withWeekOfYear(
  record: ShimPlainDateRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  return createRecordFromDateFields(
    moveToWeekOfYear(getShimPlainDateSlots(record), weekOfYear, options),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: ShimPlainDateRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  return createRecordFromDateFields(
    moveByYears(getShimPlainDateSlots(record), years, options),
  )
}

export function addMonths(
  record: ShimPlainDateRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): ShimPlainDateRecord {
  return createRecordFromDateFields(
    moveByMonths(getShimPlainDateSlots(record), months, options),
  )
}

export function addWeeks(
  record: ShimPlainDateRecord,
  weeks: number,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields({
    ...moveByIsoWeeks(slots, weeks),
    calendar: slots.calendar,
  })
}

export function addDays(
  record: ShimPlainDateRecord,
  days: number,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields({
    ...moveByDaysStrict(slots, days),
    calendar: slots.calendar,
  })
}

export const subtractYears: (
  record: ShimPlainDateRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => ShimPlainDateRecord = reversedMove(addYears)
export const subtractMonths: (
  record: ShimPlainDateRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => ShimPlainDateRecord = reversedMove(addMonths)
export const subtractWeeks: (
  record: ShimPlainDateRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => ShimPlainDateRecord = reversedMove(addWeeks)
export const subtractDays: (
  record: ShimPlainDateRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => ShimPlainDateRecord = reversedMove(addDays)

// Non-standard: Round
// -----------------------------------------------------------------------------

export const roundToYear: (
  record: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
) => ShimPlainDateRecord = bindArgs(
  roundToInterval,
  Unit.Year,
  computeYearInterval,
)

export const roundToMonth: (
  record: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
) => ShimPlainDateRecord = bindArgs(
  roundToInterval,
  Unit.Month,
  computeMonthInterval,
)

export const roundToWeek: (
  record: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
) => ShimPlainDateRecord = bindArgs(
  roundToInterval,
  Unit.Week,
  computeIsoWeekInterval,
)

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear: (record: ShimPlainDateRecord) => ShimPlainDateRecord =
  aligned(computeYearFloor)
export const startOfMonth: (
  record: ShimPlainDateRecord,
) => ShimPlainDateRecord = aligned(computeMonthFloor)
export const startOfWeek: (record: ShimPlainDateRecord) => ShimPlainDateRecord =
  aligned(computeIsoWeekFloor)

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear: (record: ShimPlainDateRecord) => ShimPlainDateRecord =
  aligned(computeYearCeil, -1)
export const endOfMonth: (record: ShimPlainDateRecord) => ShimPlainDateRecord =
  aligned(computeMonthCeil, -1)
export const endOfWeek: (record: ShimPlainDateRecord) => ShimPlainDateRecord =
  aligned(computeIsoWeekCeil, -1)

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: ShimPlainDateRecord,
  record1: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainYears(
    getShimPlainDateSlots(record0),
    getShimPlainDateSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: ShimPlainDateRecord,
  record1: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainMonths(
    getShimPlainDateSlots(record0),
    getShimPlainDateSlots(record1),
    options,
  )
}

export function diffWeeks(
  record0: ShimPlainDateRecord,
  record1: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateDayLikeUnit(Unit.Week, 7, record0, record1, options)
}

export function diffDays(
  record0: ShimPlainDateRecord,
  record1: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateDayLikeUnit(Unit.Day, 1, record0, record1, options)
}

function diffPlainDateDayLikeUnit(
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: ShimPlainDateRecord,
  record1: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const slots0 = getShimPlainDateSlots(record0)
  const slots1 = getShimPlainDateSlots(record1)

  // PlainDate day/week diffs are ISO day distances. Avoid the shared
  // date/date-time/zoned marker converter used by the cross-type helper.
  let res =
    (isoDateToEpochDays(slots1) - isoDateToEpochDays(slots0)) / daysInUnit

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

function roundToInterval(
  unit: Unit,
  computeInterval: (
    slots: CalendarDateFields & { calendar: CalendarImpl },
  ) => IsoDateTimeInterval,
  record: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  const [, roundingMode] = refineRoundToOptions(unit, options)
  const roundedIsoDateTime = roundDateToInterval(
    computeInterval,
    slots,
    roundingMode,
  )
  return createRecordFromDateFields({
    ...roundedIsoDateTime,
    calendar: slots.calendar,
  })
}

function aligned(
  computeAlignment: (
    slots: CalendarDateFields & { calendar: CalendarImpl },
  ) => CalendarDateFields,
  dayDelta = 0,
): (record: ShimPlainDateRecord) => ShimPlainDateRecord {
  return (record) => {
    const slots = getShimPlainDateSlots(record)
    const isoDate = moveByDays(computeAlignment(slots), dayDelta)
    return createRecordFromDateFields({
      ...isoDate,
      calendar: slots.calendar,
    })
  }
}

function createRecordFromDateFields(
  isoDate: CalendarDateFields & { calendar: CalendarImpl },
): ShimPlainDateRecord {
  checkIsoDateInBounds(isoDate)
  return createShimPlainDateRecord(createDateSlots(isoDate, isoDate.calendar))
}
