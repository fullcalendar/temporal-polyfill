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
  type CalendarSlot,
  getCalendarSlotId,
} from '../../internal/calendarSlot'
import { compareIsoDateFields, plainDatesEqual } from '../../internal/compare'
import { constructDateSlots } from '../../internal/construct'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  plainDateToZonedDateTime,
} from '../../internal/convert'
import { refinePlainDateObjectLike } from '../../internal/createFromFields'
import { diffPlainDates, getCommonCalendar } from '../../internal/diff'
import { timeFieldDefaults } from '../../internal/fieldNames'
import {
  CalendarDateFields,
  DateFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { createFormatPrepper, dateConfig } from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatDateIsoAuto, formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { mergePlainDateFields } from '../../internal/merge'
import { moveByDays, movePlainDate } from '../../internal/move'
import { IsoDateTimeInterval } from '../../internal/round'
import { createDateSlots } from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { checkIsoDateInBounds } from '../../internal/temporalLimits'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { Unit } from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import {
  DateTimeFormatLike,
  PlainDateToZonedDateTimeOptions,
} from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { refineRoundToOptions } from '../roundTo'
import { getPlainDateSlots, setPlainDateSlots } from '../temporalRecords'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import {
  diffPlainDays,
  diffPlainMonths,
  diffPlainWeeks,
  diffPlainYears,
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
import {
  PlainDateTimeShimRecord,
  createPlainDateTimeShimRecord,
} from './plainDateTime'
import {
  PlainMonthDayShimRecord,
  createPlainMonthDayShimRecord,
} from './plainMonthDay'
import { PlainTimeShimRecord, getPlainTimeShimRecordSlots } from './plainTime'
import {
  PlainYearMonthShimRecord,
  createPlainYearMonthShimRecord,
} from './plainYearMonth'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
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

type PlainDateRecord = RecordTypes.PlainDateRecord

type Format = DateTimeFormatLike<PlainDateShimRecord>

type PlainDateShimSlots = ReturnType<typeof constructDateSlots>

export const getPlainDateShimRecordSlots: (
  record: unknown,
) => PlainDateShimSlots = getPlainDateSlots

class _PlainDateShimRecord implements DateFields, PlainDateRecord {
  declare readonly [RecordTypes.PlainDateRecordBrand]: undefined

  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarShimRecord,
  ) {
    setPlainDateShimRecordSlots(
      this,
      constructDateSlots(
        refineCalendarShimArg,
        isoYear,
        isoMonth,
        isoDay,
        calendar,
      ),
    )
  }

  get calendarId() {
    return getCalendarSlotId(getPlainDateShimRecordSlots(this).calendar)
  }

  get era() {
    const slots = getPlainDateShimRecordSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear() {
    const slots = getPlainDateShimRecordSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year() {
    const slots = getPlainDateShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month() {
    const slots = getPlainDateShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode() {
    const slots = getPlainDateShimRecordSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day() {
    const slots = getPlainDateShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  toJSON() {
    return formatDateIsoAuto(getPlainDateShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainDateShimRecordSlots(
  instance: object,
  slots: PlainDateShimSlots,
) {
  setPlainDateSlots(instance, slots)
  attachDebugString(instance, slots, formatDateIsoAuto)
}

export function createPlainDateShimRecord(
  slots: PlainDateShimSlots,
): PlainDateShimRecord {
  const instance = Object.create(PlainDateShimRecord.prototype)
  setPlainDateShimRecordSlots(instance, slots)
  return instance
}

export type PlainDateShimRecord = _PlainDateShimRecord
export const PlainDateShimRecord = defineTemporalClass(
  _PlainDateShimRecord,
  'PlainDate',
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
): PlainDateShimRecord {
  return new PlainDateShimRecord(isoYear, isoMonth, isoDay, calendar)
}

export function fromFields(
  fields: Partial<DateFields> & { calendar: CalendarShimRecord },
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  const calendarSlot = refineCalendarShimArg(fields.calendar)
  // already proper slots
  const resSlots = refinePlainDateObjectLike(calendarSlot, fields, options)
  return createPlainDateShimRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendar: CalendarShimResolver,
): PlainDateShimRecord {
  return createPlainDateShimRecord(
    parsePlainDate(s, createCalendarShimStringResolver(getCalendar)),
  )
}

export function withCalendar(
  record: PlainDateShimRecord,
  inputCalendar: CalendarShimRecord,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const calendarSlot = refineCalendarShimArg(inputCalendar)
  return createPlainDateShimRecord(createDateSlots(slots, calendarSlot))
}

export function withFields(
  record: PlainDateShimRecord,
  mod: Partial<DateFields>,
  options?: Temporal.OverflowOptions,
) {
  const slots = getPlainDateShimRecordSlots(record)
  // already proper slots
  const resSlots = mergePlainDateFields(slots, rejectInvalidBag(mod), options)
  return createPlainDateShimRecord(resSlots)
}

export function dayOfYear(record: PlainDateShimRecord) {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function dayOfWeek(record: PlainDateShimRecord): number {
  return computeIsoDayOfWeek(getPlainDateShimRecordSlots(record))
}

export function daysInWeek(record: PlainDateShimRecord): number {
  getPlainDateShimRecordSlots(record)
  return 7
}

export function weekOfYear(record: PlainDateShimRecord): number | undefined {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(record: PlainDateShimRecord): number | undefined {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function daysInMonth(record: PlainDateShimRecord): number {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: PlainDateShimRecord): number {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: PlainDateShimRecord): number {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: PlainDateShimRecord): boolean {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function add(
  record: PlainDateShimRecord,
  durationRecord: any,
  options?: Temporal.OverflowOptions,
) {
  const slots = getPlainDateShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDate(false, slots, durationSlots, options)
  return createPlainDateShimRecord(resSlots)
}

export function subtract(
  record: PlainDateShimRecord,
  durationRecord: any,
  options?: Temporal.OverflowOptions,
) {
  const slots = getPlainDateShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDate(true, slots, durationSlots, options)
  return createPlainDateShimRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainDateShimRecord,
  otherRecord: PlainDateShimRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>,
): DurationShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const otherSlots = getPlainDateShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDates(false, calendar, slots, otherSlots, options)
  return createDurationShimRecord(resSlots)
}

export function equals(
  record: PlainDateShimRecord,
  otherRecord: PlainDateShimRecord,
): boolean {
  const slots = getPlainDateShimRecordSlots(record)
  const otherSlots = getPlainDateShimRecordSlots(otherRecord)
  return plainDatesEqual(slots, otherSlots)
}

export function compare(
  record: PlainDateShimRecord,
  otherRecord: PlainDateShimRecord,
): NumberSign {
  const slots = getPlainDateShimRecordSlots(record)
  const otherSlots = getPlainDateShimRecordSlots(otherRecord)
  return compareIsoDateFields(slots, otherSlots)
}

export function toZonedDateTime(
  record: PlainDateShimRecord,
  options: string | PlainDateToZonedDateTimeOptions<PlainTimeShimRecord>,
): ZonedDateTimeShimRecord {
  const optionsObj =
    typeof options === 'string' ? { timeZone: options } : options
  const resSlots = plainDateToZonedDateTime(
    refineTimeZoneId,
    getPlainTimeShimRecordSlots,
    getPlainDateShimRecordSlots(record),
    optionsObj,
  )
  return createZonedDateTimeShimRecord(resSlots)
}

export function toPlainDateTime(
  record: PlainDateShimRecord,
  plainTimeRecord: PlainTimeShimRecord | TimeFields = timeFieldDefaults,
): PlainDateTimeShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const timeFields =
    plainTimeRecord instanceof PlainTimeShimRecord
      ? getPlainTimeShimRecordSlots(plainTimeRecord)
      : plainTimeRecord
  const resSlots = createPlainDateTimeFromRefinedFields(
    slots,
    timeFields,
    slots.calendar,
  )
  return createPlainDateTimeShimRecord(resSlots)
}

export function toPlainYearMonth(
  record: PlainDateShimRecord,
): PlainYearMonthShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const resSlots = convertToPlainYearMonth(slots.calendar, record)
  return createPlainYearMonthShimRecord(resSlots)
}

export function toPlainMonthDay(
  record: PlainDateShimRecord,
): PlainMonthDayShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const resSlots = convertToPlainMonthDay(slots.calendar, record)
  return createPlainMonthDayShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(dateConfig)

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory(
  dateConfig,
  getPlainDateShimRecordSlots,
)

export function toLocaleString(
  record: PlainDateShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getPlainDateShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

export function toString(
  record: PlainDateShimRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return formatPlainDateIso(getPlainDateShimRecordSlots(record), options)
}

export function toSimpleString(record: PlainDateShimRecord): string {
  return formatDateIsoAuto(getPlainDateShimRecordSlots(record))
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: PlainDateShimRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveToDayOfYear(getPlainDateShimRecordSlots(record), dayOfYear, options),
  )
}

export function withDayOfMonth(
  record: PlainDateShimRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveToDayOfMonth(getPlainDateShimRecordSlots(record), dayOfMonth, options),
  )
}

export function withDayOfWeek(
  record: PlainDateShimRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  return createRecordFromDateFields({
    ...moveToDayOfWeek(slots, dayOfWeek, options),
    calendar: slots.calendar,
  })
}

export function withWeekOfYear(
  record: PlainDateShimRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveToWeekOfYear(getPlainDateShimRecordSlots(record), weekOfYear, options),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: PlainDateShimRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveByYears(getPlainDateShimRecordSlots(record), years, options),
  )
}

export function addMonths(
  record: PlainDateShimRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveByMonths(getPlainDateShimRecordSlots(record), months, options),
  )
}

export function addWeeks(
  record: PlainDateShimRecord,
  weeks: number,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  return createRecordFromDateFields({
    ...moveByIsoWeeks(slots, weeks),
    calendar: slots.calendar,
  })
}

export function addDays(
  record: PlainDateShimRecord,
  days: number,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  return createRecordFromDateFields({
    ...moveByDaysStrict(slots, days),
    calendar: slots.calendar,
  })
}

export const subtractYears: (
  record: PlainDateShimRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => PlainDateShimRecord = reversedMove(addYears)
export const subtractMonths: (
  record: PlainDateShimRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => PlainDateShimRecord = reversedMove(addMonths)
export const subtractWeeks: (
  record: PlainDateShimRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => PlainDateShimRecord = reversedMove(addWeeks)
export const subtractDays: (
  record: PlainDateShimRecord,
  units: number,
  options?: Temporal.OverflowOptions,
) => PlainDateShimRecord = reversedMove(addDays)

// Non-standard: Round
// -----------------------------------------------------------------------------

export const roundToYear: (
  record: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
) => PlainDateShimRecord = bindArgs(
  roundToInterval,
  Unit.Year,
  computeYearInterval,
)

export const roundToMonth: (
  record: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
) => PlainDateShimRecord = bindArgs(
  roundToInterval,
  Unit.Month,
  computeMonthInterval,
)

export const roundToWeek: (
  record: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
) => PlainDateShimRecord = bindArgs(
  roundToInterval,
  Unit.Week,
  computeIsoWeekInterval,
)

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear: (record: PlainDateShimRecord) => PlainDateShimRecord =
  aligned(computeYearFloor)
export const startOfMonth: (
  record: PlainDateShimRecord,
) => PlainDateShimRecord = aligned(computeMonthFloor)
export const startOfWeek: (record: PlainDateShimRecord) => PlainDateShimRecord =
  aligned(computeIsoWeekFloor)

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear: (record: PlainDateShimRecord) => PlainDateShimRecord =
  aligned(computeYearCeil, -1)
export const endOfMonth: (record: PlainDateShimRecord) => PlainDateShimRecord =
  aligned(computeMonthCeil, -1)
export const endOfWeek: (record: PlainDateShimRecord) => PlainDateShimRecord =
  aligned(computeIsoWeekCeil, -1)

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: PlainDateShimRecord,
  record1: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainYears(
    getPlainDateShimRecordSlots(record0),
    getPlainDateShimRecordSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: PlainDateShimRecord,
  record1: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainMonths(
    getPlainDateShimRecordSlots(record0),
    getPlainDateShimRecordSlots(record1),
    options,
  )
}

export function diffWeeks(
  record0: PlainDateShimRecord,
  record1: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainWeeks(
    getPlainDateShimRecordSlots(record0),
    getPlainDateShimRecordSlots(record1),
    options,
  )
}

export function diffDays(
  record0: PlainDateShimRecord,
  record1: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDays(
    getPlainDateShimRecordSlots(record0),
    getPlainDateShimRecordSlots(record1),
    options,
  )
}

function roundToInterval(
  unit: Unit,
  computeInterval: (
    slots: CalendarDateFields & { calendar: CalendarSlot },
  ) => IsoDateTimeInterval,
  record: PlainDateShimRecord,
  options?: RoundingMathOptions | RoundingMode,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const [, roundingMode] = refineRoundToOptions(unit, options)
  const roundedIsoDateTime = roundDateTimeToInterval(
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
    slots: CalendarDateFields & { calendar: CalendarSlot },
  ) => CalendarDateFields,
  dayDelta = 0,
): (record: PlainDateShimRecord) => PlainDateShimRecord {
  return (record) => {
    const slots = getPlainDateShimRecordSlots(record)
    const isoDate = moveByDays(computeAlignment(slots), dayDelta)
    return createRecordFromDateFields({
      ...isoDate,
      calendar: slots.calendar,
    })
  }
}

function createRecordFromDateFields(
  isoDate: CalendarDateFields & { calendar: CalendarSlot },
): PlainDateShimRecord {
  checkIsoDateInBounds(isoDate)
  return createPlainDateShimRecord(createDateSlots(isoDate, isoDate.calendar))
}
