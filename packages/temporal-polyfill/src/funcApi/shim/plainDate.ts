import { calendarIdGetters, dateFieldGetters } from '../../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../../apiHelpers/slotClass'
import {
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarInLeapYear,
  computeCalendarMonthsInYear,
  computeCalendarWeekOfYear,
  computeCalendarYearOfWeek,
} from '../../internal/calendarDerived'
import { type CalendarSlot } from '../../internal/calendarSlot'
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
import { formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { mergePlainDateFields } from '../../internal/merge'
import { moveByDays, movePlainDate } from '../../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
} from '../../internal/optionsModel'
import { refineUnitRoundOptions } from '../../internal/optionsRoundingRefine'
import { IsoDateTimeInterval } from '../../internal/round'
import { createDateSlots } from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { checkIsoDateInBounds } from '../../internal/temporalLimits'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { DateUnitName, Unit } from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import { DateTimeFormatLike, ToZonedDateTimeOptions } from '../commonTypes'
import { PlainDateRecordBranding } from '../recordBranding'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormat } from './dateTimeFormat'
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
import {
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

export type PlainDateShimRecord = any & DateFields
type Format = DateTimeFormatLike<PlainDateShimRecord>

export const [
  PlainDateShimRecord,
  createPlainDateShimRecord,
  getPlainDateShimRecordSlots,
] = createSlotClass(
  PlainDateRecordBranding,
  bindArgs(constructDateSlots, refineCalendarShimArg),
  formatPlainDateIso,
  {
    ...calendarIdGetters,
    ...dateFieldGetters,
  },
  {},
  {},
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
): PlainDateShimRecord {
  return new PlainDateShimRecord(isoYear, isoMonth, isoDay, calendar)
}

export function isRecord(arg: unknown): arg is PlainDateShimRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === PlainDateRecordBranding
}

export function fromFields(
  fields: Partial<DateFields> & { calendar: CalendarShimRecord },
  options?: OverflowOptions,
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
  options?: OverflowOptions,
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
  options?: OverflowOptions,
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
  options?: OverflowOptions,
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
  options?: DiffOptions<DateUnitName>,
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
  options: string | ToZonedDateTimeOptions<PlainTimeShimRecord>,
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

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    dateConfig,
    getPlainDateShimRecordSlots,
    locales,
    options,
  )
}

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
  options?: CalendarDisplayOptions,
): string {
  return formatPlainDateIso(getPlainDateShimRecordSlots(record), options)
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: PlainDateShimRecord,
  dayOfYear: number,
  options?: OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveToDayOfYear(getPlainDateShimRecordSlots(record), dayOfYear, options),
  )
}

export function withDayOfMonth(
  record: PlainDateShimRecord,
  dayOfMonth: number,
  options?: OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveToDayOfMonth(getPlainDateShimRecordSlots(record), dayOfMonth, options),
  )
}

export function withDayOfWeek(
  record: PlainDateShimRecord,
  dayOfWeek: number,
  options?: OverflowOptions,
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
  options?: OverflowOptions,
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
  options?: OverflowOptions,
): PlainDateShimRecord {
  return createRecordFromDateFields(
    moveByYears(getPlainDateShimRecordSlots(record), years, options),
  )
}

export function addMonths(
  record: PlainDateShimRecord,
  months: number,
  options?: OverflowOptions,
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

export const subtractYears = reversedMove(addYears)
export const subtractMonths = reversedMove(addMonths)
export const subtractWeeks = reversedMove(addWeeks)
export const subtractDays = reversedMove(addDays)

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

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export const startOfYear = aligned(computeYearFloor)
export const startOfMonth = aligned(computeMonthFloor)
export const startOfWeek = aligned(computeIsoWeekFloor)

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export const endOfYear = aligned(computeYearCeil, -1)
export const endOfMonth = aligned(computeMonthCeil, -1)
export const endOfWeek = aligned(computeIsoWeekCeil, -1)

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: PlainDateShimRecord,
  record1: PlainDateShimRecord,
  options?: RoundingModeName | RoundingMathOptions,
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
  options?: RoundingModeName | RoundingMathOptions,
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
  options?: RoundingModeName | RoundingMathOptions,
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
  options?: RoundingModeName | RoundingMathOptions,
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
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const [, roundingMode] = refineUnitRoundOptions(unit, options)
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
