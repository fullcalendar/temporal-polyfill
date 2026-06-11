import type { Temporal } from 'temporal-spec'
import { PlainDateBranding } from '../../apiHelpers/branding'
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
import { compareIsoDateFields, plainDatesEqual } from '../../internal/compare'
import { constructDateSlots } from '../../internal/construct'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  plainDateToZonedDateTime,
  zonedDateTimeToPlainDate,
} from '../../internal/convert'
import { refinePlainDateObjectLike } from '../../internal/createFromFields'
import { diffPlainDates } from '../../internal/diff'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  CalendarDateFields,
  DateFields,
  DateLikeObject,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformDateOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { mergePlainDateFields } from '../../internal/merge'
import { movePlainDate } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { getCommonCalendar } from '../../internal/slotUtils'
import { createDateSlots } from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { NumberSign, isObjectLike } from '../../internal/utils'
import {
  CalendarArg,
  getCalendarFromBag,
  refineCalendarArg,
} from './calendarArg'
import { resolveAnyCalendarArg, resolveAnyCalendarId } from './calendarResolve'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import {
  PlainDateTime,
  createPlainDateTime,
  getPlainDateTimeSlotsIfPresent,
} from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import {
  PlainTimeArg,
  optionalToPlainTimeFields,
  toPlainTimeSlots,
} from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { rejectInvalidBag } from './temporalSlots'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import {
  ZonedDateTime,
  createZonedDateTime,
  getZonedDateTimeSlotsIfPresent,
} from './zonedDateTime'

export type PlainDateArg = PlainDate | DateLikeObject | string

type PlainDateSlots = CalendarDateFields & { calendar: CalendarImpl }

const plainDateSlotsMap = new WeakMap<object, PlainDateSlots>()

export class PlainDate implements DateFields {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar: string | undefined = undefined,
  ) {
    initPlainDate(
      this,
      constructDateSlots(
        resolveAnyCalendarArg,
        isoYear,
        isoMonth,
        isoDay,
        calendar,
      ),
    )
  }

  static from(
    arg: any,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDate {
    return createPlainDate(toPlainDateSlots(arg, options))
  }

  static compare(arg0: PlainDateArg, arg1: PlainDateArg): NumberSign {
    return compareIsoDateFields(toPlainDateSlots(arg0), toPlainDateSlots(arg1))
  }

  get calendarId(): string {
    return getCalendarSlotId(getPlainDateSlots(this).calendar)
  }

  get era(): string | undefined {
    const slots = getPlainDateSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear(): number | undefined {
    const slots = getPlainDateSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode(): string {
    const slots = getPlainDateSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  get dayOfWeek(): number {
    return computeIsoDayOfWeek(getPlainDateSlots(this))
  }

  get dayOfYear(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarDayOfYear(slots.calendar, slots)
  }

  get weekOfYear(): number | undefined {
    const slots = getPlainDateSlots(this)
    return computeCalendarWeekOfYear(slots.calendar, slots)
  }

  get yearOfWeek(): number | undefined {
    const slots = getPlainDateSlots(this)
    return computeCalendarYearOfWeek(slots.calendar, slots)
  }

  get daysInWeek(): number {
    getPlainDateSlots(this)
    return 7
  }

  get daysInMonth(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarDaysInMonth(slots.calendar, slots)
  }

  get daysInYear(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarDaysInYear(slots.calendar, slots)
  }

  get monthsInYear(): number {
    const slots = getPlainDateSlots(this)
    return computeCalendarMonthsInYear(slots.calendar, slots)
  }

  get inLeapYear(): boolean {
    const slots = getPlainDateSlots(this)
    return computeCalendarInLeapYear(slots.calendar, slots)
  }

  with(
    mod: Partial<DateFields>,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDate {
    const slots = getPlainDateSlots(this)
    return createPlainDate(
      mergePlainDateFields(slots, rejectInvalidBag(mod), options),
    )
  }

  withCalendar(calendarArg: CalendarArg): PlainDate {
    const slots = getPlainDateSlots(this)
    return createPlainDate(
      createDateSlots(slots, refineCalendarArg(calendarArg)),
    )
  }

  add(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDate {
    return createPlainDate(
      movePlainDate(
        false,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  subtract(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainDate {
    return createPlainDate(
      movePlainDate(
        true,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  until(
    otherArg: PlainDateArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>
      | undefined = undefined,
  ): Duration {
    const slots = getPlainDateSlots(this)
    const other = toPlainDateSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      diffPlainDates(false, calendar, slots, other, options),
    )
  }

  since(
    otherArg: PlainDateArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>
      | undefined = undefined,
  ): Duration {
    const slots = getPlainDateSlots(this)
    const other = toPlainDateSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(diffPlainDates(true, calendar, slots, other, options))
  }

  equals(otherArg: PlainDateArg): boolean {
    return plainDatesEqual(getPlainDateSlots(this), toPlainDateSlots(otherArg))
  }

  toZonedDateTime(
    options: TimeZoneArg | { timeZone: TimeZoneArg; plainTime?: PlainTimeArg },
  ): ZonedDateTime {
    const optionsObj = !isObjectLike(options)
      ? { timeZone: options }
      : {
          timeZone: (options as { timeZone: TimeZoneArg }).timeZone,
          plainTime: (options as { plainTime?: PlainTimeArg }).plainTime,
        }

    return createZonedDateTime(
      plainDateToZonedDateTime(
        refineTimeZoneArg,
        toPlainTimeSlots,
        getPlainDateSlots(this),
        optionsObj,
      ),
    )
  }

  toPlainDateTime(
    plainTimeArg: PlainTimeArg | undefined = undefined,
  ): PlainDateTime {
    const slots = getPlainDateSlots(this)
    return createPlainDateTime(
      createPlainDateTimeFromRefinedFields(
        slots,
        optionalToPlainTimeFields(plainTimeArg),
        slots.calendar,
      ),
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    const slots = getPlainDateSlots(this)
    return createPlainYearMonth(convertToPlainYearMonth(slots.calendar, this))
  }

  toPlainMonthDay(): PlainMonthDay {
    const slots = getPlainDateSlots(this)
    return createPlainMonthDay(convertToPlainMonthDay(slots.calendar, this))
  }

  toLocaleString(
    locales: LocalesArg | undefined = undefined,
    options: Intl.DateTimeFormatOptions = {},
  ): string {
    const slots = getPlainDateSlots(this)
    const format = new RawDateTimeFormat(
      locales,
      applyPlainFormatTimeZone(
        transformDateOptions(options, /* allowPartialOverlap = */ false),
      ),
    )
    checkResolvedCalendarCompatible(format, slots)
    return format.format(isoDateToEpochMilli(slots))
  }

  toString(
    options: Temporal.PlainDateToStringOptions | undefined = undefined,
  ): string {
    return formatPlainDateIso(getPlainDateSlots(this), options)
  }

  toJSON(): string {
    return formatPlainDateIso(getPlainDateSlots(this))
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(PlainDate, PlainDateBranding)
export function createPlainDate(slots: PlainDateSlots): PlainDate {
  return initPlainDate(Object.create(PlainDate.prototype), slots)
}

export function getPlainDateSlots(obj: unknown): PlainDateSlots {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = plainDateSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
}

export function getPlainDateSlotsIfPresent(
  obj: unknown,
): PlainDateSlots | undefined {
  return plainDateSlotsMap.get(obj as object)
}

export function toPlainDateSlots(
  arg: PlainDateArg,
  options?: Temporal.OverflowOptions,
): PlainDateSlots {
  if (isObjectLike(arg)) {
    const ownSlots = getPlainDateSlotsIfPresent(arg)

    if (ownSlots) {
      refineOverflowOptions(options) // parse unused options
      return ownSlots
    }

    const dateTimeSlots = getPlainDateTimeSlotsIfPresent(arg)

    if (dateTimeSlots) {
      refineOverflowOptions(options) // parse unused options
      return createDateSlots(dateTimeSlots, dateTimeSlots.calendar)
    }

    const zonedDateTimeSlots = getZonedDateTimeSlotsIfPresent(arg)

    if (zonedDateTimeSlots) {
      refineOverflowOptions(options) // parse unused options
      return zonedDateTimeToPlainDate(zonedDateTimeSlots)
    }

    const calendar = getCalendarFromBag(arg as DateLikeObject)
    return refinePlainDateObjectLike(calendar, arg as DateLikeObject, options)
  }

  const res = parsePlainDate(arg, resolveAnyCalendarId)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainDate(instance: PlainDate, slots: PlainDateSlots): PlainDate {
  plainDateSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, formatPlainDateIso)
  return instance
}
