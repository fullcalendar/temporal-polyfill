import type { Temporal } from 'temporal-spec'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
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
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../../internal/compare'
import { constructDateTimeSlots } from '../../internal/construct'
import {
  plainDateTimeToZonedDateTime,
  zonedDateTimeToPlainDateTime,
} from '../../internal/convert'
import { refinePlainDateTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainDateTimes } from '../../internal/diff'
import { isoDateTimeToEpochMilli } from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import { timeFieldDefaults } from '../../internal/fieldNames'
import {
  CalendarDateTimeFields,
  DateLikeObject,
  DateTimeFields,
  DateTimeLikeObject,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformDateTimeOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatPlainDateTimeIso } from '../../internal/isoFormat'
import { parsePlainDateTime } from '../../internal/isoParse'
import { mergePlainDateTimeFields } from '../../internal/merge'
import { movePlainDateTime } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { roundPlainDateTime } from '../../internal/round'
import { getCommonCalendar } from '../../internal/slotUtils'
import {
  createDateSlots,
  createDateTimeSlots,
  createTimeSlots,
} from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { queryTimeZone } from '../../internal/timeZone'
import { NumberSign, isObjectLike } from '../../internal/utils'
import {
  CalendarArg,
  getCalendarFromBag,
  refineCalendarArg,
} from './calendarArg'
import {
  resolveBasicCalendarArg,
  resolveBasicCalendarId,
} from './calendarResolve'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import {
  PlainDate,
  createPlainDate,
  getPlainDateSlotsIfPresent,
} from './plainDate'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { rejectInvalidBag } from './temporalSlots'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import {
  ZonedDateTime,
  createZonedDateTime,
  getZonedDateTimeSlotsIfPresent,
} from './zonedDateTime'

export type PlainDateTimeArg = PlainDateTime | DateTimeLikeObject | string

type PlainDateTimeSlots = CalendarDateTimeFields & { calendar: CalendarImpl }

const plainDateTimeSlotsMap = new WeakMap<object, PlainDateTimeSlots>()

export class PlainDateTime implements DateTimeFields {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
    calendar: string | undefined = undefined,
  ) {
    initPlainDateTime(
      this,
      constructDateTimeSlots(
        resolveBasicCalendarArg,
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
      ),
    )
  }

  static from(
    arg: PlainDateTimeArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDateTime {
    return createPlainDateTime(toPlainDateTimeSlots(arg, options))
  }

  static compare(arg0: PlainDateTimeArg, arg1: PlainDateTimeArg): NumberSign {
    const slots0 = toPlainDateTimeSlots(arg0)
    const slots1 = toPlainDateTimeSlots(arg1)
    return compareIsoDateTimeFields(slots0, slots1)
  }

  get calendarId(): string {
    return getCalendarSlotId(getPlainDateTimeSlots(this).calendar)
  }

  get era(): string | undefined {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear(): number | undefined {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode(): string {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  get dayOfWeek(): number {
    return computeIsoDayOfWeek(getPlainDateTimeSlots(this))
  }

  get dayOfYear(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarDayOfYear(slots.calendar, slots)
  }

  get weekOfYear(): number | undefined {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarWeekOfYear(slots.calendar, slots)
  }

  get yearOfWeek(): number | undefined {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarYearOfWeek(slots.calendar, slots)
  }

  get daysInWeek(): number {
    getPlainDateTimeSlots(this)
    return 7
  }

  get daysInMonth(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarDaysInMonth(slots.calendar, slots)
  }

  get daysInYear(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarDaysInYear(slots.calendar, slots)
  }

  get monthsInYear(): number {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarMonthsInYear(slots.calendar, slots)
  }

  get inLeapYear(): boolean {
    const slots = getPlainDateTimeSlots(this)
    return computeCalendarInLeapYear(slots.calendar, slots)
  }

  get hour(): number {
    return getPlainDateTimeSlots(this).hour
  }

  get minute(): number {
    return getPlainDateTimeSlots(this).minute
  }

  get second(): number {
    return getPlainDateTimeSlots(this).second
  }

  get millisecond(): number {
    return getPlainDateTimeSlots(this).millisecond
  }

  get microsecond(): number {
    return getPlainDateTimeSlots(this).microsecond
  }

  get nanosecond(): number {
    return getPlainDateTimeSlots(this).nanosecond
  }

  with(
    mod: Partial<DateTimeFields>,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDateTime {
    return createPlainDateTime(
      mergePlainDateTimeFields(
        getPlainDateTimeSlots(this),
        rejectInvalidBag(mod),
        options,
      ),
    )
  }

  withCalendar(calendarArg: CalendarArg): PlainDateTime {
    const slots = getPlainDateTimeSlots(this)
    return createPlainDateTime(
      createDateTimeSlots(slots, refineCalendarArg(calendarArg)),
    )
  }

  withPlainTime(
    plainTimeArg: PlainTimeArg | undefined = undefined,
  ): PlainDateTime {
    const slots = getPlainDateTimeSlots(this)
    return createPlainDateTime(
      createPlainDateTimeFromRefinedFields(
        slots,
        optionalToPlainTimeFields(plainTimeArg),
        slots.calendar,
      ),
    )
  }

  add(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDateTime {
    return createPlainDateTime(
      movePlainDateTime(
        false,
        getPlainDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  subtract(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDateTime {
    return createPlainDateTime(
      movePlainDateTime(
        true,
        getPlainDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  until(
    otherArg: PlainDateTimeArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<
          Temporal.DateUnit | Temporal.TimeUnit
        >
      | undefined = undefined,
  ): Duration {
    const slots = getPlainDateTimeSlots(this)
    const other = toPlainDateTimeSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      diffPlainDateTimes(false, calendar, slots, other, options),
    )
  }

  since(
    otherArg: PlainDateTimeArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<
          Temporal.DateUnit | Temporal.TimeUnit
        >
      | undefined = undefined,
  ): Duration {
    const slots = getPlainDateTimeSlots(this)
    const other = toPlainDateTimeSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      diffPlainDateTimes(true, calendar, slots, other, options),
    )
  }

  round(
    options:
      | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
      | Temporal.RoundingOptions<'day' | Temporal.TimeUnit>,
  ): PlainDateTime {
    return createPlainDateTime(
      roundPlainDateTime(getPlainDateTimeSlots(this), options),
    )
  }

  equals(otherArg: PlainDateTimeArg): boolean {
    return plainDateTimesEqual(
      getPlainDateTimeSlots(this),
      toPlainDateTimeSlots(otherArg),
    )
  }

  toZonedDateTime(
    timeZoneArg: TimeZoneArg,
    options: Temporal.DisambiguationOptions | undefined = undefined,
  ): ZonedDateTime {
    return createZonedDateTime(
      plainDateTimeToZonedDateTime(
        getPlainDateTimeSlots(this),
        queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        options,
      ),
    )
  }

  toPlainDate(): PlainDate {
    const slots = getPlainDateTimeSlots(this)
    return createPlainDate(createDateSlots(slots, slots.calendar))
  }

  toPlainTime(): PlainTime {
    return createPlainTime(createTimeSlots(getPlainDateTimeSlots(this)))
  }

  toLocaleString(
    locales: LocalesArg | undefined = undefined,
    options: Intl.DateTimeFormatOptions = {},
  ): string {
    const slots = getPlainDateTimeSlots(this)
    const format = new RawDateTimeFormat(
      locales,
      applyPlainFormatTimeZone(
        transformDateTimeOptions(options, /* allowPartialOverlap = */ false),
      ),
    )
    checkResolvedCalendarCompatible(format, slots)
    return format.format(isoDateTimeToEpochMilli(slots))
  }

  toString(
    options: Temporal.PlainDateTimeToStringOptions | undefined = undefined,
  ): string {
    return formatPlainDateTimeIso(getPlainDateTimeSlots(this), options)
  }

  toJSON(): string {
    return formatPlainDateTimeIso(getPlainDateTimeSlots(this))
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(PlainDateTime, 'PlainDateTime')
export function createPlainDateTime(slots: PlainDateTimeSlots): PlainDateTime {
  return initPlainDateTime(Object.create(PlainDateTime.prototype), slots)
}

export function getPlainDateTimeSlots(obj: unknown): PlainDateTimeSlots {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = plainDateTimeSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
}

export function getPlainDateTimeSlotsIfPresent(
  obj: unknown,
): PlainDateTimeSlots | undefined {
  return plainDateTimeSlotsMap.get(obj as object)
}

export function toPlainDateTimeSlots(
  arg: PlainDateTimeArg,
  options?: Temporal.OverflowOptions,
): PlainDateTimeSlots {
  if (isObjectLike(arg)) {
    const ownSlots = getPlainDateTimeSlotsIfPresent(arg)

    if (ownSlots) {
      refineOverflowOptions(options) // parse unused options
      return ownSlots
    }

    const dateSlots = getPlainDateSlotsIfPresent(arg)

    if (dateSlots) {
      refineOverflowOptions(options) // parse unused options
      return createDateTimeSlots(
        combineDateAndTime(dateSlots, timeFieldDefaults),
        dateSlots.calendar,
      )
    }

    const zonedDateTimeSlots = getZonedDateTimeSlotsIfPresent(arg)

    if (zonedDateTimeSlots) {
      refineOverflowOptions(options) // parse unused options
      return zonedDateTimeToPlainDateTime(zonedDateTimeSlots)
    }

    const calendar = getCalendarFromBag(arg as DateLikeObject)
    return refinePlainDateTimeObjectLike(
      calendar,
      arg as DateLikeObject,
      options,
    )
  }

  const res = parsePlainDateTime(arg, resolveBasicCalendarId)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainDateTime(
  instance: PlainDateTime,
  slots: PlainDateTimeSlots,
): PlainDateTime {
  plainDateTimeSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, formatPlainDateTimeIso)
  return instance
}
