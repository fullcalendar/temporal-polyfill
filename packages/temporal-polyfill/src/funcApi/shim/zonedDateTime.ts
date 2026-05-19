import { calendarIdGetters, epochGetters } from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import {
  compareZonedDateTimes,
  zonedDateTimesEqual,
} from '../../internal/compare'
import { constructZonedEpochNanoSlots } from '../../internal/construct'
import { refineZonedDateTimeObjectLike } from '../../internal/createFromFields'
import { diffZonedDateTimes, getCommonCalendar } from '../../internal/diff'
import {
  getInternalCalendarId,
  isoCalendar,
} from '../../internal/externalCalendar'
import { DateTimeFields } from '../../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
} from '../../internal/isoFormat'
import { parseZonedDateTime } from '../../internal/isoParse'
import { mergeZonedDateTimeFields } from '../../internal/merge'
import { moveZonedDateTime } from '../../internal/move'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../../internal/optionsModel'
import {
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
} from '../../internal/round'
import {
  createZonedEpochNanoSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../../internal/slots'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import {
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
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
import { ZonedDateTimeRecordBranding } from '../common-branding'
import { CalendarShimRecord, getCalendarShimRecordInternal } from './calendar'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'

type ZonedDateTimeShimFields = Partial<DateTimeFields> & {
  calendar?: CalendarShimRecord
  offset?: string
  timeZone: string
}

export type ZonedDateTimeShimRecord = any

export const [
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
  getZonedDateTimeShimRecordSlots,
] = createSlotClass(
  ZonedDateTimeRecordBranding,
  (
    epochNanoseconds: bigint,
    timeZoneId: string,
    calendar?: CalendarShimRecord,
  ) =>
    constructZonedEpochNanoSlots(
      epochNanoseconds,
      timeZoneId,
      calendar === undefined
        ? undefined
        : getInternalCalendarId(getCalendarShimRecordInternal(calendar)),
    ),
  formatZonedDateTimeIso,
  {
    ...epochGetters,
    ...calendarIdGetters,
    timeZoneId(slots: any): string {
      return slots.timeZone.id
    },
  },
  {},
  {},
)

export function create(
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: CalendarShimRecord,
): ZonedDateTimeShimRecord {
  return new ZonedDateTimeShimRecord(epochNanoseconds, timeZoneId, calendar)
}

export function fromFields(
  fields: ZonedDateTimeShimFields,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  const inputCalendar = fields.calendar
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  const resSlots = refineZonedDateTimeObjectLike(
    refineTimeZoneId,
    internalCalendar,
    fields as any,
    options,
  )
  return createZonedDateTimeShimRecord(resSlots)
}

export function fromString(
  s: string,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  return createZonedDateTimeShimRecord(parseZonedDateTime(s, options))
}

export function withFields(
  record: ZonedDateTimeShimRecord,
  mod: Partial<DateTimeFields>,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const resSlots = mergeZonedDateTimeFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createZonedDateTimeShimRecord(resSlots)
}

export function withCalendar(
  record: ZonedDateTimeShimRecord,
  inputCalendar: CalendarShimRecord,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  return createZonedDateTimeShimRecord(
    createZonedEpochNanoSlots(
      slots.epochNanoseconds,
      slots.timeZone,
      internalCalendar,
    ),
  )
}

export function withTimeZone(
  record: ZonedDateTimeShimRecord,
  timeZoneId: string,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  return createZonedDateTimeShimRecord(
    createZonedEpochNanoSlots(
      slots.epochNanoseconds,
      queryTimeZone(refineTimeZoneId(timeZoneId)),
      slots.calendar,
    ),
  )
}

export function epochSeconds(record: ZonedDateTimeShimRecord): number {
  return getEpochSec(getZonedDateTimeShimRecordSlots(record))
}

export function epochMilliseconds(record: ZonedDateTimeShimRecord): number {
  return getEpochMilli(getZonedDateTimeShimRecordSlots(record))
}

export function epochMicroseconds(record: ZonedDateTimeShimRecord): bigint {
  return getEpochMicro(getZonedDateTimeShimRecordSlots(record))
}

export function epochNanoseconds(record: ZonedDateTimeShimRecord): bigint {
  return getEpochNano(getZonedDateTimeShimRecordSlots(record))
}

export function offsetNanoseconds(record: ZonedDateTimeShimRecord): number {
  return zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
    .offsetNanoseconds
}

export function offset(record: ZonedDateTimeShimRecord): string {
  return formatOffsetNano(offsetNanoseconds(record))
}

export function dayOfWeek(record: ZonedDateTimeShimRecord): number {
  return computeIsoDayOfWeek(
    zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record)),
  )
}

export function daysInWeek(record: ZonedDateTimeShimRecord): number {
  getZonedDateTimeShimRecordSlots(record)
  return 7
}

export function weekOfYear(
  record: ZonedDateTimeShimRecord,
): number | undefined {
  return computeDateProperty(record, computeWeekOfYear)
}

export function yearOfWeek(
  record: ZonedDateTimeShimRecord,
): number | undefined {
  return computeDateProperty(record, computeYearOfWeek)
}

export function dayOfYear(record: ZonedDateTimeShimRecord): number {
  return computeDateProperty(record, computeDayOfYear)
}

export function daysInMonth(record: ZonedDateTimeShimRecord): number {
  return computeDateProperty(record, computeDaysInMonth)
}

export function daysInYear(record: ZonedDateTimeShimRecord): number {
  return computeDateProperty(record, computeDaysInYear)
}

export function monthsInYear(record: ZonedDateTimeShimRecord): number {
  return computeDateProperty(record, computeMonthsInYear)
}

export function inLeapYear(record: ZonedDateTimeShimRecord): boolean {
  return computeDateProperty(record, computeInLeapYear)
}

export function hoursInDay(record: ZonedDateTimeShimRecord): number {
  return computeZonedHoursInDay(getZonedDateTimeShimRecordSlots(record))
}

export function toString(
  record: ZonedDateTimeShimRecord,
  options?: ZonedDateTimeDisplayOptions,
): string {
  return formatZonedDateTimeIso(
    getZonedDateTimeShimRecordSlots(record),
    options,
  )
}

export function add(
  record: ZonedDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = moveZonedDateTime(false, slots, durationSlots, options)
  return createZonedDateTimeShimRecord(resSlots)
}

export function subtract(
  record: ZonedDateTimeShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = moveZonedDateTime(true, slots, durationSlots, options)
  return createZonedDateTimeShimRecord(resSlots)
}

export function until(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
  options?: DiffOptions<UnitName>,
): DurationShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffZonedDateTimes(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function since(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
  options?: DiffOptions<UnitName>,
): DurationShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffZonedDateTimes(
    true,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function round(
  record: ZonedDateTimeShimRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeShimRecord {
  return createZonedDateTimeShimRecord(
    roundZonedDateTime(getZonedDateTimeShimRecordSlots(record), options),
  )
}

export function startOfDay(
  record: ZonedDateTimeShimRecord,
): ZonedDateTimeShimRecord {
  return createZonedDateTimeShimRecord(
    computeZonedStartOfDay(getZonedDateTimeShimRecordSlots(record)),
  )
}

export function getTimeZoneTransition(
  record: ZonedDateTimeShimRecord,
  options: DirectionOptions | DirectionName,
): ZonedDateTimeShimRecord | null {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const epochNanoseconds = getTimeZoneTransitionEpochNanoseconds(slots, options)
  return epochNanoseconds
    ? createZonedDateTimeShimRecord({ ...slots, epochNanoseconds })
    : null
}

export function equals(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
): boolean {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  return zonedDateTimesEqual(slots, otherSlots)
}

export function compare(
  record: ZonedDateTimeShimRecord,
  otherRecord: ZonedDateTimeShimRecord,
): NumberSign {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const otherSlots = getZonedDateTimeShimRecordSlots(otherRecord)
  return compareZonedDateTimes(slots, otherSlots)
}

function computeDateProperty<R>(
  record: ZonedDateTimeShimRecord,
  compute: (dateRecord: any) => R,
): R {
  return compute(zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record)))
}
