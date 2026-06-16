import type { Temporal as TemporalSpec } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { dateFieldGetters } from '../../apiHelpers/shimMixins'
import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
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
import { toIntegerWithTrunc } from '../../internal/cast'
import { compareIsoDateFields, plainDatesEqual } from '../../internal/compare'
import { plainDateToZonedDateTime } from '../../internal/convert'
import { refinePlainDateObjectLike } from '../../internal/createFromFields'
import { diffPlainDates } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
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
import {
  computeIsoDayOfWeek,
  validateIsoDateFields,
} from '../../internal/isoCalendarMath'
import { formatDateIsoAuto, formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { mergePlainDateFields } from '../../internal/merge'
import { moveByDays, moveDate } from '../../internal/move'
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
import { NumberSign, bindArgs, mapProps } from '../../internal/utils'
import { CalendarRecord } from '../calendarRecord'
import {
  DateTimeFormatLike,
  PlainDateToZonedDateTimeOptions,
} from '../commonTypes'
import { PlainDateRecordBranding } from '../recordBranding'
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
import { validateBag } from './temporalRecords'
import {
  ShimZonedDateTimeRecord,
  createShimZonedDateTimeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<ShimPlainDateRecord>
type ShimPlainDateSlots = CalendarDateFields & { calendar: CalendarImpl }

export const getShimPlainDateSlots: (record: unknown) => ShimPlainDateSlots =
  getPlainDateSlots

export type ShimPlainDateRecord = InstanceType<typeof ShimPlainDateRecord> &
  RecordTypes.PlainDateRecord

export const ShimPlainDateRecord = defineTemporalClass(
  PlainDateRecordBranding,
  class {
    declare readonly [RecordTypes.PlainDateRecordBrand]: undefined

    get calendarId() {
      return getCalendarSlotId(getShimPlainDateSlots(this).calendar)
    }

    toJSON() {
      return formatDateIsoAuto(getShimPlainDateSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  getShimPlainDateSlots,
  dateFieldGetters,
)

export function createShimPlainDateRecord(
  slots: ShimPlainDateSlots,
): ShimPlainDateRecord {
  const instance = Object.create(ShimPlainDateRecord.prototype)
  setPlainDateSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
): ShimPlainDateRecord {
  const fields = checkIsoDateInBounds(
    validateIsoDateFields(
      mapProps(toIntegerWithTrunc, {
        year: isoYear,
        month: isoMonth,
        day: isoDay,
      }),
    ),
  )
  const calendarImpl = refineShimCalendarArgMaybe(calendar)
  return createShimPlainDateRecord(createDateSlots(fields, calendarImpl))
}

export function fromFields(
  fields: Partial<DateFields & { calendar: CalendarRecord }>,
  options?: TemporalSpec.OverflowOptions,
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

export function withFields(
  record: ShimPlainDateRecord,
  mod: Partial<DateFields>,
  options?: TemporalSpec.OverflowOptions,
) {
  const slots = getShimPlainDateSlots(record)
  const resSlots = mergePlainDateFields(slots, validateBag(mod), options)
  return createShimPlainDateRecord(resSlots)
}

export function withCalendar(
  record: ShimPlainDateRecord,
  inputCalendar: CalendarRecord,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  const calendarImpl = getCalendarRecordImpl(inputCalendar)
  return createShimPlainDateRecord(createDateSlots(slots, calendarImpl))
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

export function dayOfYear(record: ShimPlainDateRecord) {
  const slots = getShimPlainDateSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
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
  options?: TemporalSpec.OverflowOptions,
) {
  const slots = getShimPlainDateSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createDateSlots(
    moveDate(slots.calendar, slots, durationSlots, options),
    slots.calendar,
  )
  return createShimPlainDateRecord(resSlots)
}

export function subtract(
  record: ShimPlainDateRecord,
  durationRecord: any,
  options?: TemporalSpec.OverflowOptions,
) {
  const slots = getShimPlainDateSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createDateSlots(
    moveDate(
      slots.calendar,
      slots,
      negateDurationFields(durationSlots),
      options,
    ),
    slots.calendar,
  )
  return createShimPlainDateRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimPlainDateRecord,
  otherRecord: ShimPlainDateRecord,
  options?: TemporalSpec.RoundingOptionsWithLargestUnit<TemporalSpec.DateUnit>,
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
    applyPlainFormatTimeZone(transformDateOptions(options)),
  )
  checkResolvedCalendarCompatible(format, slots)
  return format.format(isoDateToEpochMilli(slots))
}

export function toString(
  record: ShimPlainDateRecord,
  options?: TemporalSpec.PlainDateToStringOptions,
): string {
  return formatPlainDateIso(getShimPlainDateSlots(record), options)
}

export function toBasicString(record: ShimPlainDateRecord): string {
  return formatDateIsoAuto(getShimPlainDateSlots(record))
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

// Type the bare global `Temporal` value (module-scoped, NOT `declare global`,
// so it never leaks into a consumer's environment). Lets `toTemporal` build via
// `new Temporal.PlainDate(...)` — smaller than `globalThis.Temporal`, read lazily.
declare const Temporal: { PlainDate: TemporalSpec.PlainDateConstructor }

export function toTemporal(
  record: ShimPlainDateRecord,
): TemporalSpec.PlainDate {
  const slots = getShimPlainDateSlots(record)
  return new Temporal.PlainDate(
    slots.year,
    slots.month,
    slots.day,
    getCalendarSlotId(slots.calendar),
  )
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: ShimPlainDateRecord,
  dayOfYear: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveToDayOfYear(slots.calendar, slots, dayOfYear, options),
      slots.calendar,
    ),
  )
}

export function withDayOfMonth(
  record: ShimPlainDateRecord,
  dayOfMonth: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveToDayOfMonth(slots.calendar, slots, dayOfMonth, options),
      slots.calendar,
    ),
  )
}

export function withDayOfWeek(
  record: ShimPlainDateRecord,
  dayOfWeek: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveToDayOfWeek(slots.calendar, slots, dayOfWeek, options),
      slots.calendar,
    ),
  )
}

export function withWeekOfYear(
  record: ShimPlainDateRecord,
  weekOfYear: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveToWeekOfYear(slots.calendar, slots, weekOfYear, options),
      slots.calendar,
    ),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: ShimPlainDateRecord,
  years: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveByYears(slots.calendar, slots, years, options),
      slots.calendar,
    ),
  )
}

export function addMonths(
  record: ShimPlainDateRecord,
  months: number,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveByMonths(slots.calendar, slots, months, options),
      slots.calendar,
    ),
  )
}

export function addWeeks(
  record: ShimPlainDateRecord,
  weeks: number,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveByIsoWeeks(slots.calendar, slots, weeks),
      slots.calendar,
    ),
  )
}

export function addDays(
  record: ShimPlainDateRecord,
  days: number,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  return createRecordFromDateFields(
    createDateSlots(
      moveByDaysStrict(slots.calendar, slots, days),
      slots.calendar,
    ),
  )
}

export const subtractYears: (
  record: ShimPlainDateRecord,
  units: number,
  options?: TemporalSpec.OverflowOptions,
) => ShimPlainDateRecord = (record, units, options) =>
  addYears(record, -units, options)
export const subtractMonths: (
  record: ShimPlainDateRecord,
  units: number,
  options?: TemporalSpec.OverflowOptions,
) => ShimPlainDateRecord = (record, units, options) =>
  addMonths(record, -units, options)
export const subtractWeeks: (
  record: ShimPlainDateRecord,
  units: number,
  options?: TemporalSpec.OverflowOptions,
) => ShimPlainDateRecord = (record, units) => addWeeks(record, -units)
export const subtractDays: (
  record: ShimPlainDateRecord,
  units: number,
  options?: TemporalSpec.OverflowOptions,
) => ShimPlainDateRecord = (record, units) => addDays(record, -units)

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
    calendar: CalendarImpl,
    slots: CalendarDateFields,
  ) => IsoDateTimeInterval,
  record: ShimPlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimPlainDateRecord {
  const slots = getShimPlainDateSlots(record)
  const [, roundingMode] = refineRoundToOptions(unit, options)
  const roundedIsoDateTime = roundDateToInterval(
    computeInterval,
    slots.calendar,
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
    calendar: CalendarImpl,
    slots: CalendarDateFields,
  ) => CalendarDateFields,
  dayDelta = 0,
): (record: ShimPlainDateRecord) => ShimPlainDateRecord {
  return (record) => {
    const slots = getShimPlainDateSlots(record)
    const isoDate = moveByDays(
      computeAlignment(slots.calendar, slots),
      dayDelta,
    )
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
