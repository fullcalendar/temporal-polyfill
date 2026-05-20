import { calendarIdGetters, dateFieldGetters } from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import {
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarInLeapYear,
  computeCalendarMonthsInYear,
  computeCalendarWeekOfYear,
  computeCalendarYearOfWeek,
} from '../../internal/calendarDerived'
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
import { DateFields, TimeFields } from '../../internal/fieldTypes'
import { createFormatPrepper, dateConfig } from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { mergePlainDateFields } from '../../internal/merge'
import { movePlainDate } from '../../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { createDateSlots } from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { DateUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { PlainDateRecordBranding } from '../common-branding'
import { DateTimeFormatLike, createDateTimeFormat } from '../dateTimeFormat'
import {
  CalendarShimArg,
  refineCalendarShimArg,
  refineCalendarShimArgToId,
} from './calendar'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
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
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

type ToZonedDateTimeOptions = {
  timeZone: string
  plainTime?: PlainTimeShimRecord
}

export type PlainDateShimRecord = any & DateFields
type Format = DateTimeFormatLike<PlainDateShimRecord>

export const [
  PlainDateShimRecord,
  createPlainDateShimRecord,
  getPlainDateShimRecordSlots,
] = createSlotClass(
  PlainDateRecordBranding,
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarShimArg,
  ) => {
    return constructDateSlots(
      isoYear,
      isoMonth,
      isoDay,
      refineCalendarShimArgToId(calendar),
    )
  },
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
  calendar?: CalendarShimArg,
): PlainDateShimRecord {
  return new PlainDateShimRecord(isoYear, isoMonth, isoDay, calendar)
}

export function fromFields(
  fields: Partial<DateFields> & { calendar: CalendarShimArg },
  options?: OverflowOptions,
): PlainDateShimRecord {
  const internalCalendar = refineCalendarShimArg(fields.calendar)
  // already proper slots
  const resSlots = refinePlainDateObjectLike(internalCalendar, fields, options)
  return createPlainDateShimRecord(resSlots)
}

export function fromString(s: string): PlainDateShimRecord {
  return createPlainDateShimRecord(parsePlainDate(s))
}

export function withCalendar(
  record: PlainDateShimRecord,
  inputCalendar: CalendarShimArg,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const internalCalendar = refineCalendarShimArg(inputCalendar)
  return createPlainDateShimRecord(createDateSlots(slots, internalCalendar))
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
  options: string | ToZonedDateTimeOptions,
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
