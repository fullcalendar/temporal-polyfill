import {
  calendarIdGetters,
  dateFieldGetters,
  timeGetters,
} from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../../internal/compare'
import { constructDateTimeSlots } from '../../internal/construct'
import { refinePlainDateTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainDateTimes, getCommonCalendar } from '../../internal/diff'
import { isoCalendar } from '../../internal/externalCalendar'
import { DateTimeFields } from '../../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatPlainDateTimeIso } from '../../internal/isoFormat'
import { parsePlainDateTime } from '../../internal/isoParse'
import { mergePlainDateTimeFields } from '../../internal/merge'
import { movePlainDateTime } from '../../internal/move'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { roundPlainDateTime } from '../../internal/round'
import { createDateTimeSlots } from '../../internal/slots'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import {
  computeDayOfYear,
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeWeekOfYear,
  computeYearOfWeek,
} from '../calendarUtils'
import { PlainDateTimeRecordBranding } from '../common-branding'
import { CalendarShimRecord, getCalendarShimRecordInternal } from './calendar'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'

export type PlainDateTimeShimRecord = any & DateTimeFields

export const [
  PlainDateTimeShimRecord,
  createPlainDateTimeShimRecord,
  getPlainDateTimeShimRecordSlots,
] = createSlotClass(
  PlainDateTimeRecordBranding,
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
    calendar?: CalendarShimRecord,
  ) => {
    return constructDateTimeSlots(
      isoYear,
      isoMonth,
      isoDay,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      // TODO: update constructDateTimeSlots to accept InternalCalendar directly,
      // not a string calendarId that needs to be refined.
      calendar === undefined
        ? undefined
        : (getCalendarShimRecordInternal(calendar) as any), // !!!
    )
  },
  formatPlainDateTimeIso,
  {
    ...calendarIdGetters,
    ...dateFieldGetters,
    ...timeGetters,
  },
  {},
  {},
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
  return new PlainDateTimeShimRecord(
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
  )
}

export function fromFields(
  fields: Partial<DateTimeFields> & { calendar: CalendarShimRecord },
  options?: OverflowOptions,
): PlainDateTimeShimRecord {
  const inputCalendar = fields.calendar
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  // already proper slots
  const resSlots = refinePlainDateTimeObjectLike(
    internalCalendar,
    fields,
    options,
  )
  return createPlainDateTimeShimRecord(resSlots)
}

export function fromString(s: string): PlainDateTimeShimRecord {
  return createPlainDateTimeShimRecord(parsePlainDateTime(s))
}

export function withCalendar(
  record: PlainDateTimeShimRecord,
  inputCalendar: CalendarShimRecord,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  return createDateTimeSlots(slots, internalCalendar)
}

export function withFields(
  record: PlainDateTimeShimRecord,
  mod: Partial<DateTimeFields>,
  options?: OverflowOptions,
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
  return computeWeekOfYear(getPlainDateTimeShimRecordSlots(record))
}

export function yearOfWeek(
  record: PlainDateTimeShimRecord,
): number | undefined {
  return computeYearOfWeek(getPlainDateTimeShimRecordSlots(record))
}

export function dayOfYear(record: PlainDateTimeShimRecord): number {
  return computeDayOfYear(getPlainDateTimeShimRecordSlots(record))
}

export function daysInMonth(record: PlainDateTimeShimRecord): number {
  return computeDaysInMonth(getPlainDateTimeShimRecordSlots(record))
}

export function daysInYear(record: PlainDateTimeShimRecord): number {
  return computeDaysInYear(getPlainDateTimeShimRecordSlots(record))
}

export function monthsInYear(record: PlainDateTimeShimRecord): number {
  return computeMonthsInYear(getPlainDateTimeShimRecordSlots(record))
}

export function inLeapYear(record: PlainDateTimeShimRecord): boolean {
  return computeInLeapYear(getPlainDateTimeShimRecordSlots(record))
}

export function add(
  record: PlainDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
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
  options?: OverflowOptions,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDateTime(true, slots, durationSlots, options)
  return createPlainDateTimeShimRecord(resSlots)
}

export function until(
  record: PlainDateTimeShimRecord,
  otherRecord: PlainDateTimeShimRecord,
  options?: DiffOptions<UnitName>,
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

export function since(
  record: PlainDateTimeShimRecord,
  otherRecord: PlainDateTimeShimRecord,
  options?: DiffOptions<UnitName>,
): DurationShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const otherSlots = getPlainDateTimeShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDateTimes(
    true,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function round(
  record: PlainDateTimeShimRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  return createPlainDateTimeShimRecord(roundPlainDateTime(slots, options))
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

export function toString(
  record: PlainDateTimeShimRecord,
  options?: DateTimeDisplayOptions,
): string {
  return formatPlainDateTimeIso(
    getPlainDateTimeShimRecordSlots(record),
    options,
  )
}
