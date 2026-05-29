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
import { CalendarSlot, getCalendarSlotId } from '../../internal/calendarSlot'
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
import * as errorMessages from '../../internal/errorMessages'
import {
  DateTimeFields,
  ZonedDateTimeLikeObject,
} from '../../internal/fieldTypes'
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
import { refineZonedFieldOptions } from '../../internal/optionsFieldRefine'
import {
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
} from '../../internal/round'
import {
  ZonedEpochNanoFields,
  createDurationSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { queryTimeZone } from '../../internal/timeZone'
import {
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
import { NumberSign, isObjectLike } from '../../internal/utils'
import { prepZonedDateTimeFormat } from '../intlFormatConfig'
import {
  CalendarArg,
  getCalendarFromBag,
  refineCalendarArg,
} from './calendarArg'
import { resolveAnyCalendar, resolveAnyCalendarArg } from './calendarResolve'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { rejectInvalidBag } from './temporalSlots'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'

export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeLikeObject | string

type ZonedDateTimeSlots = ZonedEpochNanoFields & { calendar: CalendarSlot }

const zonedDateTimeSlotsMap = new WeakMap<object, ZonedDateTimeSlots>()

export class ZonedDateTime {
  constructor(
    epochNanoseconds: bigint,
    timeZoneId: string,
    calendar: string | undefined = undefined,
  ) {
    initZonedDateTime(
      this,
      constructZonedEpochNanoSlots(
        resolveAnyCalendarArg,
        epochNanoseconds,
        timeZoneId,
        calendar,
      ),
    )
  }

  static from(
    arg: any,
    options: Temporal.ZonedDateTimeFromOptions | undefined = undefined,
  ): ZonedDateTime {
    return createZonedDateTime(toZonedDateTimeSlots(arg, options))
  }

  static compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumberSign {
    return compareZonedDateTimes(
      toZonedDateTimeSlots(arg0),
      toZonedDateTimeSlots(arg1),
    )
  }

  get epochMilliseconds(): number {
    return getEpochMilli(getZonedDateTimeSlots(this))
  }

  get epochNanoseconds(): bigint {
    return getEpochNano(getZonedDateTimeSlots(this))
  }

  get calendarId(): string {
    return getCalendarSlotId(getZonedDateTimeSlots(this).calendar)
  }

  get era(): string | undefined {
    const slots = getZonedDateTimeSlots(this)
    const isoDateTime = zonedEpochSlotsToIso(slots)
    return computeCalendarEraFields(slots.calendar, isoDateTime).era
  }

  get eraYear(): number | undefined {
    const slots = getZonedDateTimeSlots(this)
    const isoDateTime = zonedEpochSlotsToIso(slots)
    return computeCalendarEraFields(slots.calendar, isoDateTime).eraYear
  }

  get year(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarDateFields(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    ).year
  }

  get month(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarDateFields(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    ).month
  }

  get monthCode(): string {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarMonthCode(slots.calendar, zonedEpochSlotsToIso(slots))
  }

  get day(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarDateFields(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    ).day
  }

  get hour(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).hour
  }

  get minute(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).minute
  }

  get second(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).second
  }

  get millisecond(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).millisecond
  }

  get microsecond(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).microsecond
  }

  get nanosecond(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).nanosecond
  }

  get dayOfWeek(): number {
    return computeIsoDayOfWeek(
      zonedEpochSlotsToIso(getZonedDateTimeSlots(this)),
    )
  }

  get dayOfYear(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarDayOfYear(slots.calendar, zonedEpochSlotsToIso(slots))
  }

  get weekOfYear(): number | undefined {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarWeekOfYear(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    )
  }

  get yearOfWeek(): number | undefined {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarYearOfWeek(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    )
  }

  get daysInWeek(): number {
    getZonedDateTimeSlots(this)
    return 7
  }

  get daysInMonth(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarDaysInMonth(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    )
  }

  get daysInYear(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarDaysInYear(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    )
  }

  get monthsInYear(): number {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarMonthsInYear(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    )
  }

  get inLeapYear(): boolean {
    const slots = getZonedDateTimeSlots(this)
    return computeCalendarInLeapYear(
      slots.calendar,
      zonedEpochSlotsToIso(slots),
    )
  }

  get offset(): string {
    return formatOffsetNano(
      zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).offsetNanoseconds,
    )
  }

  get offsetNanoseconds(): number {
    return zonedEpochSlotsToIso(getZonedDateTimeSlots(this)).offsetNanoseconds
  }

  get timeZoneId(): string {
    return getZonedDateTimeSlots(this).timeZone.id
  }

  get hoursInDay(): number {
    return computeZonedHoursInDay(getZonedDateTimeSlots(this))
  }

  with(
    mod: Partial<DateTimeFields>,
    options: Temporal.ZonedDateTimeFromOptions | undefined = undefined,
  ): ZonedDateTime {
    return createZonedDateTime(
      mergeZonedDateTimeFields(
        getZonedDateTimeSlots(this),
        rejectInvalidBag(mod),
        options,
      ),
    )
  }

  withCalendar(calendarArg: CalendarArg): ZonedDateTime {
    return createZonedDateTime({
      ...getZonedDateTimeSlots(this),
      calendar: refineCalendarArg(calendarArg),
    })
  }

  withTimeZone(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime({
      ...getZonedDateTimeSlots(this),
      timeZone: queryTimeZone(refineTimeZoneArg(timeZoneArg)),
    })
  }

  withPlainTime(
    plainTimeArg: PlainTimeArg | undefined = undefined,
  ): ZonedDateTime {
    return createZonedDateTime(
      zonedDateTimeWithPlainTime(
        getZonedDateTimeSlots(this),
        optionalToPlainTimeFields(plainTimeArg),
      ),
    )
  }

  add(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): ZonedDateTime {
    return createZonedDateTime(
      moveZonedDateTime(
        false,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  subtract(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): ZonedDateTime {
    return createZonedDateTime(
      moveZonedDateTime(
        true,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  until(
    otherArg: ZonedDateTimeArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<
          Temporal.DateUnit | Temporal.TimeUnit
        >
      | undefined = undefined,
  ): Duration {
    const slots = getZonedDateTimeSlots(this)
    const other = toZonedDateTimeSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      createDurationSlots(
        diffZonedDateTimes(false, calendar, slots, other, options),
      ),
    )
  }

  since(
    otherArg: ZonedDateTimeArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<
          Temporal.DateUnit | Temporal.TimeUnit
        >
      | undefined = undefined,
  ): Duration {
    const slots = getZonedDateTimeSlots(this)
    const other = toZonedDateTimeSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      createDurationSlots(
        diffZonedDateTimes(true, calendar, slots, other, options),
      ),
    )
  }

  round(
    options:
      | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
      | Temporal.RoundingOptions<'day' | Temporal.TimeUnit>,
  ): ZonedDateTime {
    return createZonedDateTime(
      roundZonedDateTime(getZonedDateTimeSlots(this), options),
    )
  }

  startOfDay(): ZonedDateTime {
    return createZonedDateTime(
      computeZonedStartOfDay(getZonedDateTimeSlots(this)),
    )
  }

  equals(otherArg: ZonedDateTimeArg): boolean {
    return zonedDateTimesEqual(
      getZonedDateTimeSlots(this),
      toZonedDateTimeSlots(otherArg),
    )
  }

  toInstant(): Instant {
    return createInstant(zonedDateTimeToInstant(getZonedDateTimeSlots(this)))
  }

  toPlainDateTime(): PlainDateTime {
    return createPlainDateTime(
      zonedDateTimeToPlainDateTime(getZonedDateTimeSlots(this)),
    )
  }

  toPlainDate(): PlainDate {
    return createPlainDate(
      zonedDateTimeToPlainDate(getZonedDateTimeSlots(this)),
    )
  }

  toPlainTime(): PlainTime {
    return createPlainTime(
      zonedDateTimeToPlainTime(getZonedDateTimeSlots(this)),
    )
  }

  toLocaleString(
    locales: LocalesArg | undefined = undefined,
    options: Intl.DateTimeFormatOptions | undefined = undefined,
  ): string {
    const [format, epochMilli] = prepZonedDateTimeFormat(
      locales,
      options,
      getZonedDateTimeSlots(this),
    )
    return format.format(epochMilli)
  }

  toString(
    options: Temporal.ZonedDateTimeToStringOptions | undefined = undefined,
  ): string {
    return formatZonedDateTimeIso(getZonedDateTimeSlots(this), options)
  }

  toJSON(): string {
    return formatZonedDateTimeIso(getZonedDateTimeSlots(this))
  }

  getTimeZoneTransition(
    options:
      | Temporal.TransitionOptions
      | Temporal.TransitionOptions['direction'],
  ): ZonedDateTime | null {
    const slots = getZonedDateTimeSlots(this)
    const newEpochNano = getTimeZoneTransitionEpochNanoseconds(slots, options)

    if (newEpochNano) {
      return createZonedDateTime({
        ...slots,
        epochNanoseconds: newEpochNano,
      })
    }

    return null
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(ZonedDateTime, 'ZonedDateTime')
export function createZonedDateTime(slots: ZonedDateTimeSlots): ZonedDateTime {
  return initZonedDateTime(Object.create(ZonedDateTime.prototype), slots)
}

export function getZonedDateTimeSlots(obj: unknown): ZonedDateTimeSlots {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = zonedDateTimeSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
}

export function getZonedDateTimeSlotsIfPresent(
  obj: unknown,
): ZonedDateTimeSlots | undefined {
  return zonedDateTimeSlotsMap.get(obj as object)
}

export function toZonedDateTimeSlots(
  arg: ZonedDateTimeArg,
  options?: Temporal.ZonedDateTimeFromOptions,
): ZonedDateTimeSlots {
  if (isObjectLike(arg)) {
    const ownSlots = getZonedDateTimeSlotsIfPresent(arg)

    if (ownSlots) {
      refineZonedFieldOptions(options) // parse unused options
      return ownSlots
    }

    const calendar = getCalendarFromBag(arg as ZonedDateTimeLikeObject)

    return refineZonedDateTimeObjectLike(
      refineTimeZoneArg,
      calendar,
      arg as ZonedDateTimeLikeObject,
      options,
    )
  }

  return parseZonedDateTime(arg, resolveAnyCalendar, options)
}

function initZonedDateTime(
  instance: ZonedDateTime,
  slots: ZonedDateTimeSlots,
): ZonedDateTime {
  zonedDateTimeSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, formatZonedDateTimeIso)
  return instance
}
