import type { Temporal } from 'temporal-spec'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import {
  computeCalendarDateFields,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCode,
  computeCalendarMonthsInYear,
} from '../../internal/calendarDerived'
import { CalendarSlot, getCalendarSlotId } from '../../internal/calendarSlot'
import {
  compareIsoDateFields,
  plainYearMonthsEqual,
} from '../../internal/compare'
import { constructYearMonthSlots } from '../../internal/construct'
import { convertPlainYearMonthToDate } from '../../internal/convert'
import { refinePlainYearMonthObjectLike } from '../../internal/createFromFields'
import { diffPlainYearMonth } from '../../internal/diff'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  CalendarDateFields,
  YearMonthFields,
  YearMonthLikeObject,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
  strictPartialDateCalendarCheck,
} from '../../internal/intlFormatArgs'
import { transformYearMonthOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../../internal/isoFormat'
import { parsePlainYearMonth } from '../../internal/isoParse'
import { mergePlainYearMonthFields } from '../../internal/merge'
import { movePlainYearMonth } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { getCommonCalendar } from '../../internal/slotUtils'
import { NumberSign, isObjectLike } from '../../internal/utils'
import { getCalendarFromBag } from './calendarArg'
import { resolveAnyCalendar, resolveAnyCalendarArg } from './calendarResolve'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { PlainDate, createPlainDate } from './plainDate'
import { rejectInvalidBag } from './temporalSlots'

export type PlainYearMonthArg = PlainYearMonth | YearMonthLikeObject | string

type PlainYearMonthSlots = CalendarDateFields & { calendar: CalendarSlot }

const plainYearMonthSlotsMap = new WeakMap<object, PlainYearMonthSlots>()

export class PlainYearMonth implements YearMonthFields {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendar: string | undefined = undefined,
    referenceIsoDay?: number,
  ) {
    initPlainYearMonth(
      this,
      constructYearMonthSlots(
        resolveAnyCalendarArg,
        isoYear,
        isoMonth,
        calendar,
        referenceIsoDay,
      ),
    )
  }

  static from(
    arg: PlainYearMonthArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainYearMonth {
    return createPlainYearMonth(toPlainYearMonthSlots(arg, options))
  }

  static compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumberSign {
    return compareIsoDateFields(
      toPlainYearMonthSlots(arg0),
      toPlainYearMonthSlots(arg1),
    )
  }

  get calendarId(): string {
    return getCalendarSlotId(getPlainYearMonthSlots(this).calendar)
  }

  get era(): string | undefined {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).era
  }

  get eraYear(): number | undefined {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  }

  get year(): number {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).year
  }

  get month(): number {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).month
  }

  get monthCode(): string {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get daysInMonth(): number {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarDaysInMonth(slots.calendar, slots)
  }

  get daysInYear(): number {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarDaysInYear(slots.calendar, slots)
  }

  get monthsInYear(): number {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarMonthsInYear(slots.calendar, slots)
  }

  get inLeapYear(): boolean {
    const slots = getPlainYearMonthSlots(this)
    return computeCalendarInLeapYear(slots.calendar, slots)
  }

  with(
    mod: Partial<YearMonthFields>,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainYearMonth {
    return createPlainYearMonth(
      mergePlainYearMonthFields(
        getPlainYearMonthSlots(this),
        rejectInvalidBag(mod),
        options,
      ),
    )
  }

  add(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainYearMonth {
    return createPlainYearMonth(
      movePlainYearMonth(
        false,
        getPlainYearMonthSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  subtract(
    durationArg: DurationArg,
    options: Temporal.OverflowOptions | undefined = undefined,
  ): PlainYearMonth {
    return createPlainYearMonth(
      movePlainYearMonth(
        true,
        getPlainYearMonthSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    )
  }

  until(
    otherArg: PlainYearMonthArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>
      | undefined = undefined,
  ): Duration {
    const slots = getPlainYearMonthSlots(this)
    const other = toPlainYearMonthSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      diffPlainYearMonth(false, calendar, slots, other, options),
    )
  }

  since(
    otherArg: PlainYearMonthArg,
    options:
      | Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>
      | undefined = undefined,
  ): Duration {
    const slots = getPlainYearMonthSlots(this)
    const other = toPlainYearMonthSlots(otherArg)
    const calendar = getCommonCalendar(slots.calendar, other.calendar)
    return createDuration(
      diffPlainYearMonth(true, calendar, slots, other, options),
    )
  }

  equals(otherArg: PlainYearMonthArg): boolean {
    return plainYearMonthsEqual(
      getPlainYearMonthSlots(this),
      toPlainYearMonthSlots(otherArg),
    )
  }

  toPlainDate(bag: { day: number }): PlainDate {
    const slots = getPlainYearMonthSlots(this)
    return createPlainDate(
      convertPlainYearMonthToDate(slots.calendar, this, bag),
    )
  }

  toLocaleString(
    locales: LocalesArg | undefined = undefined,
    options: Intl.DateTimeFormatOptions = {},
  ): string {
    const slots = getPlainYearMonthSlots(this)
    const format = new RawDateTimeFormat(
      locales,
      applyPlainFormatTimeZone(
        transformYearMonthOptions(options, /* allowPartialOverlap = */ false),
      ),
    )
    checkResolvedCalendarCompatible(
      format,
      slots,
      strictPartialDateCalendarCheck,
    )
    return format.format(isoDateToEpochMilli(slots)!)
  }

  toString(
    options: Temporal.PlainDateToStringOptions | undefined = undefined,
  ): string {
    return formatPlainYearMonthIso(getPlainYearMonthSlots(this), options)
  }

  toJSON(): string {
    return formatPlainYearMonthIso(getPlainYearMonthSlots(this))
  }

  valueOf(): never {
    return forbiddenValueOf()
  }
}

defineTemporalClass(PlainYearMonth, 'PlainYearMonth')
export function createPlainYearMonth(
  slots: PlainYearMonthSlots,
): PlainYearMonth {
  return initPlainYearMonth(Object.create(PlainYearMonth.prototype), slots)
}

export function getPlainYearMonthSlots(obj: unknown): PlainYearMonthSlots {
  // Precondition: callers only pass object-like receivers because WeakMap
  // lookup itself rejects primitives.
  const slots = plainYearMonthSlotsMap.get(obj as object)

  if (!slots) {
    throw new TypeError(errorMessages.invalidCallingContext)
  }

  return slots
}

export function getPlainYearMonthSlotsIfPresent(
  obj: unknown,
): PlainYearMonthSlots | undefined {
  return plainYearMonthSlotsMap.get(obj as object)
}

export function toPlainYearMonthSlots(
  arg: PlainYearMonthArg,
  options?: Temporal.OverflowOptions,
): PlainYearMonthSlots {
  if (isObjectLike(arg)) {
    const ownSlots = getPlainYearMonthSlotsIfPresent(arg)

    if (ownSlots) {
      refineOverflowOptions(options) // parse unused options
      return ownSlots
    }

    const calendar = getCalendarFromBag(arg as YearMonthLikeObject)
    return refinePlainYearMonthObjectLike(calendar, arg as any, options)
  }

  const res = parsePlainYearMonth(arg, resolveAnyCalendar)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainYearMonth(
  instance: PlainYearMonth,
  slots: PlainYearMonthSlots,
): PlainYearMonth {
  plainYearMonthSlotsMap.set(instance, slots)
  attachDebugString(instance, slots, formatPlainYearMonthIso)
  return instance
}
