import {
  calendarIdGetters,
  dateFieldGetters,
  timeGetters,
} from '../../classApi/mixins'
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
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../../internal/compare'
import { constructDateTimeSlots } from '../../internal/construct'
import { plainDateTimeToZonedDateTime } from '../../internal/convert'
import { refinePlainDateTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainDateTimes, getCommonCalendar } from '../../internal/diff'
import { timeFieldDefaults } from '../../internal/fieldNames'
import { DateTimeFields, TimeFields } from '../../internal/fieldTypes'
import {
  createFormatPrepper,
  dateTimeConfig,
} from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatPlainDateTimeIso } from '../../internal/isoFormat'
import { parsePlainDateTime } from '../../internal/isoParse'
import { mergePlainDateTimeFields } from '../../internal/merge'
import { movePlainDateTime } from '../../internal/move'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { roundPlainDateTime } from '../../internal/round'
import {
  createDateSlots,
  createDateTimeSlots,
  createTimeSlots,
} from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { PlainDateTimeRecordBranding } from '../common-branding'
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
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  PlainTimeShimRecord,
  createPlainTimeShimRecord,
  getPlainTimeShimRecordSlots,
} from './plainTime'
import {
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

export type PlainDateTimeShimRecord = any & DateTimeFields
type Format = DateTimeFormatLike<PlainDateTimeShimRecord>

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
    calendar?: CalendarShimArg,
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
      refineCalendarShimArgToId(calendar),
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
  calendar?: CalendarShimArg,
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
  fields: Partial<DateTimeFields> & { calendar: CalendarShimArg },
  options?: OverflowOptions,
): PlainDateTimeShimRecord {
  const internalCalendar = refineCalendarShimArg(fields.calendar)
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
  inputCalendar: CalendarShimArg,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const internalCalendar = refineCalendarShimArg(inputCalendar)
  return createPlainDateTimeShimRecord(
    createDateTimeSlots(slots, internalCalendar),
  )
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

export function withPlainTime(
  record: PlainDateTimeShimRecord,
  plainTimeRecord: PlainTimeShimRecord | TimeFields = timeFieldDefaults,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
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

// this is equivalent to Temporal's `until`
export function diff(
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

export function round(
  record: PlainDateTimeShimRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeShimRecord {
  const slots = getPlainDateTimeShimRecordSlots(record)
  const resSlots = roundPlainDateTime(slots, options)
  return createPlainDateTimeShimRecord(resSlots)
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
  options?: EpochDisambigOptions,
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

const prepFormat = createFormatPrepper(dateTimeConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    dateTimeConfig,
    getPlainDateTimeShimRecordSlots,
    locales,
    options,
  )
}

export function toLocaleString(
  record: PlainDateTimeShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getPlainDateTimeShimRecordSlots(record),
  )
  return format.format(epochMilli)
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
