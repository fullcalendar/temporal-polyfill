import { isoCalendarId } from '../internal/calendarConfig'
import { DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { ensureString, toBigInt } from '../internal/cast'
import { bigIntToDayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields, isoDateTimeFieldNamesAlpha } from '../internal/calendarIsoFields'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/formatIso'
import { checkEpochNanoInBounds } from '../internal/epochAndTime'
import { parseZonedDateTime } from '../internal/parseIso'
import { moveZonedDateTime } from '../internal/move'
import { OffsetDisambig } from '../internal/options'
import { roundZonedDateTime } from '../internal/round'
import { SimpleTimeZoneOps, TimeZoneOps, computeHoursInDay, computeStartOfDay, getMatchingInstantFor, zonedInternalsToIso } from '../internal/timeZoneOps'
import { pluckProps } from '../internal/utils'
import { DiffOptions, OverflowOptions, ZonedFieldOptions, prepareOptions } from '../internal/optionsRefine'
import { IdLike, PlainDateSlots, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, getPreferredCalendarSlot } from '../internal/slots'
import { DateModOps, DateRefineOps, DiffOps, MoveOps } from '../internal/calendarOps'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { diffZonedDateTimes } from '../internal/diff'
import { ZonedDateTimeBag, mergeZonedDateTimeBag, refineZonedDateTimeBag, zonedDateTimeWithFields } from '../internal/bag'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { zonedDateTimeToInstant, zonedDateTimeToPlainDate, zonedDateTimeToPlainDateTime, zonedDateTimeToPlainMonthDay, zonedDateTimeToPlainTime, zonedDateTimeToPlainYearMonth } from '../internal/convert'
import { slotsWithCalendar, slotsWithTimeZone, zonedDateTimeWithPlainDate, zonedDateTimeWithPlainTime } from '../internal/slotsMod'
import { createZonedDateTimeSlots } from '../internal/slotsCreate'

export const create = createZonedDateTimeSlots

export const fromString = parseZonedDateTime

export const fromFields = refineZonedDateTimeBag

export function getISOFields<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): IsoDateTimeFields & { calendar: C, timeZone: T, offset: string } {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots as any, getTimeZoneOps(zonedDateTimeSlots.timeZone))

  return { // alphabetical
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds), // TODO: more DRY
    timeZone: zonedDateTimeSlots.timeZone,
  }
}

export const withFields = zonedDateTimeWithFields

export const withPlainTime = zonedDateTimeWithPlainTime

export const withPlainDate = zonedDateTimeWithPlainDate

export const withTimeZone = slotsWithTimeZone

export const withCalendar = slotsWithCalendar

export const add = moveZonedDateTime

export function subtract<C, T>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  durationSlots: DurationFields,
  options?: OverflowOptions,
): ZonedDateTimeSlots<C, T> {
  return add(getCalendarOps, getTimeZoneOps, zonedDateTimeSlots, negateDuration(durationSlots), options)
}

export function until<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions,
): DurationFields {
  return diffZonedDateTimes(getCalendarOps, getTimeZoneOps, zonedDateTimeSlots0, zonedDateTimeSlots1, options)
}

export function since<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions,
): DurationFields {
  return diffZonedDateTimes(getCalendarOps, getTimeZoneOps, zonedDateTimeSlots0, zonedDateTimeSlots1, options, true)
}

export const round = roundZonedDateTime

export const startOfDay = computeStartOfDay

export const hoursInDay = computeHoursInDay

export const compare = compareZonedDateTimes

export const equals = zonedDateTimesEqual

export const toString = formatZonedDateTimeIso

export function toJSON<C extends IdLike, T extends IdLike>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): string {
  return toString(getTimeZoneOps, zonedDateTimeSlots0)
}

export const toInstant = zonedDateTimeToInstant
export const toPlainDate = zonedDateTimeToPlainDate
export const toPlainTime = zonedDateTimeToPlainTime
export const toPlainDateTime = zonedDateTimeToPlainDateTime
export const toPlainYearMonth = zonedDateTimeToPlainYearMonth
export const toPlainMonthDay = zonedDateTimeToPlainMonthDay
