import {
  calendarIdGetters,
  dateGetters,
  epochGetters,
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
  compareZonedDateTimes,
  zonedDateTimesEqual,
} from '../../internal/compare'
import { constructZonedEpochNanoSlots } from '../../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../../internal/convert'
import { refineZonedDateTimeObjectLike } from '../../internal/createFromFields'
import { diffZonedDateTimes, getCommonCalendar } from '../../internal/diff'
import { DateTimeFields } from '../../internal/fieldTypes'
import { createFormatPrepper, zonedConfig } from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
} from '../../internal/isoFormat'
import { parseZonedDateTime } from '../../internal/isoParse'
import { mergeZonedDateTimeFields } from '../../internal/merge'
import { zonedDateTimeWithPlainTime } from '../../internal/modify'
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
import { createZonedEpochNanoSlots } from '../../internal/slots'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import {
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign, mapProps } from '../../internal/utils'
import { ZonedDateTimeRecordBranding } from '../common-branding'
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
import { InstantShimRecord, createInstantShimRecord } from './instant'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  PlainDateTimeShimRecord,
  createPlainDateTimeShimRecord,
} from './plainDateTime'
import {
  PlainTimeShimRecord,
  createPlainTimeShimRecord,
  getPlainTimeShimRecordSlots,
} from './plainTime'

type ZonedDateTimeShimFields = Partial<DateTimeFields> & {
  calendar?: CalendarShimArg
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
  (epochNanoseconds: bigint, timeZoneId: string, calendar?: CalendarShimArg) =>
    constructZonedEpochNanoSlots(
      epochNanoseconds,
      timeZoneId,
      refineCalendarShimArgToId(calendar),
    ),
  formatZonedDateTimeIso,
  {
    ...epochGetters,
    ...calendarIdGetters,
    ...adaptDateMethods(dateGetters),
    ...adaptDateMethods(timeGetters),
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
  calendar?: CalendarShimArg,
): ZonedDateTimeShimRecord {
  return new ZonedDateTimeShimRecord(epochNanoseconds, timeZoneId, calendar)
}

export function fromFields(
  fields: ZonedDateTimeShimFields,
  options?: ZonedFieldOptions,
): ZonedDateTimeShimRecord {
  const inputCalendar = fields.calendar
  const internalCalendar = refineCalendarShimArg(inputCalendar)
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
  inputCalendar: CalendarShimArg,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const internalCalendar = refineCalendarShimArg(inputCalendar)
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

export function withPlainTime(
  record: ZonedDateTimeShimRecord,
  plainTimeRecord?: PlainTimeShimRecord,
): ZonedDateTimeShimRecord {
  const slots = getZonedDateTimeShimRecordSlots(record)
  const plainTimeSlots =
    plainTimeRecord === undefined
      ? undefined
      : getPlainTimeShimRecordSlots(plainTimeRecord)
  const resSlots = zonedDateTimeWithPlainTime(slots, plainTimeSlots)
  return createZonedDateTimeShimRecord(resSlots)
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
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarWeekOfYear(slots.calendar, slots)
}

export function yearOfWeek(
  record: ZonedDateTimeShimRecord,
): number | undefined {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarYearOfWeek(slots.calendar, slots)
}

export function dayOfYear(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function daysInMonth(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: ZonedDateTimeShimRecord): number {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: ZonedDateTimeShimRecord): boolean {
  const slots = zonedEpochSlotsToIso(getZonedDateTimeShimRecordSlots(record))
  return computeCalendarInLeapYear(slots.calendar, slots)
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

// this is equivalent to Temporal's `until`
export function diff(
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

export function toInstant(record: ZonedDateTimeShimRecord): InstantShimRecord {
  const resSlots = zonedDateTimeToInstant(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createInstantShimRecord(resSlots)
}

export function toPlainDateTime(
  record: ZonedDateTimeShimRecord,
): PlainDateTimeShimRecord {
  const resSlots = zonedDateTimeToPlainDateTime(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createPlainDateTimeShimRecord(resSlots)
}

export function toPlainDate(
  record: ZonedDateTimeShimRecord,
): PlainDateShimRecord {
  const resSlots = zonedDateTimeToPlainDate(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createPlainDateShimRecord(resSlots)
}

export function toPlainTime(
  record: ZonedDateTimeShimRecord,
): PlainTimeShimRecord {
  const resSlots = zonedDateTimeToPlainTime(
    getZonedDateTimeShimRecordSlots(record),
  )
  return createPlainTimeShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(zonedConfig)

export function toLocaleString(
  record: ZonedDateTimeShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getZonedDateTimeShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

function adaptDateMethods(methods: any) {
  return mapProps((method: any) => {
    return (slots: any) => {
      return method(zonedEpochSlotsToIso(slots))
    }
  }, methods)
}
