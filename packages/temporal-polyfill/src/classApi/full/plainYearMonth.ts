import type { Temporal } from 'temporal-spec'
import { PlainYearMonthBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
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
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toIntegerWithTruncation } from '../../internal/cast'
import {
  compareIsoDateFields,
  plainYearMonthsEqual,
} from '../../internal/compare'
import { convertPlainYearMonthToDate } from '../../internal/convert'
import { refinePlainYearMonthObjectLike } from '../../internal/createFromFields'
import { diffPlainYearMonth } from '../../internal/diff'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import {
  CalendarDateFields,
  YearMonthFields,
  YearMonthLikeObject,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformYearMonthOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { validateIsoDateFields } from '../../internal/isoCalendarMath'
import { formatPlainYearMonthIso } from '../../internal/isoFormat'
import { parsePlainYearMonth } from '../../internal/isoParse'
import { mergePlainYearMonthFields } from '../../internal/merge'
import { moveYearMonth } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { getCommonCalendar } from '../../internal/slotUtils'
import { createDateSlots } from '../../internal/slots'
import { checkIsoYearMonthInBounds } from '../../internal/temporalLimits'
import { NumberSign, isObjectLike } from '../../internal/utils'
import { getCalendarFromBag } from './calendarArg'
import { resolveAnyCalendarArg, resolveAnyCalendarId } from './calendarResolve'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { PlainDate, createPlainDate } from './plainDate'
import { validateBag } from './temporalSlots'

export type PlainYearMonthArg = PlainYearMonth | YearMonthLikeObject | string

type PlainYearMonthSlots = CalendarDateFields & { calendar: CalendarImpl }

const plainYearMonthSlotsMap = new WeakMap<object, PlainYearMonthSlots>()

export type PlainYearMonth = InstanceType<typeof PlainYearMonth>
export const PlainYearMonth = defineTemporalClass(
  PlainYearMonthBranding,
  class implements YearMonthFields {
    constructor(
      isoYear: number,
      isoMonth: number,
      calendar: string | undefined = undefined,
      referenceIsoDay?: number,
    ) {
      const isoYearInt = toIntegerWithTruncation(isoYear)
      const isoMonthInt = toIntegerWithTruncation(isoMonth)
      const calendarImpl = resolveAnyCalendarArg(calendar)
      const isoDayInt = toIntegerWithTruncation(referenceIsoDay ?? 1)
      const fields = checkIsoYearMonthInBounds(
        validateIsoDateFields({
          year: isoYearInt,
          month: isoMonthInt,
          day: isoDayInt,
        }),
      )
      initPlainYearMonth(this, createDateSlots(fields, calendarImpl))
    }

    static from(
      arg: PlainYearMonthArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainYearMonth {
      return createPlainYearMonth(toPlainYearMonthSlots(arg, options))
    }

    static compare(
      arg0: PlainYearMonthArg,
      arg1: PlainYearMonthArg,
    ): NumberSign {
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
          validateBag(mod),
          options,
        ),
      )
    }

    add(
      durationArg: DurationArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainYearMonth {
      const slots = getPlainYearMonthSlots(this)
      return createPlainYearMonth(
        createDateSlots(
          moveYearMonth(
            false,
            slots.calendar,
            slots,
            toDurationSlots(durationArg),
            options,
          ),
          slots.calendar,
        ),
      )
    }

    subtract(
      durationArg: DurationArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainYearMonth {
      const slots = getPlainYearMonthSlots(this)
      return createPlainYearMonth(
        createDateSlots(
          moveYearMonth(
            true,
            slots.calendar,
            slots,
            toDurationSlots(durationArg),
            options,
          ),
          slots.calendar,
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
      checkResolvedCalendarCompatible(format, slots, true)
      return format.format(isoDateToEpochMilli(slots))
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
  },
)

export function createPlainYearMonth(
  slots: PlainYearMonthSlots,
): PlainYearMonth {
  return initPlainYearMonth(Object.create(PlainYearMonth.prototype), slots)
}

export function getPlainYearMonthSlots(obj: unknown): PlainYearMonthSlots {
  return getPlainYearMonthSlotsIfPresent(obj) || invalidRecordType()
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

  const res = parsePlainYearMonth(arg, resolveAnyCalendarId)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainYearMonth(
  instance: object,
  slots: PlainYearMonthSlots,
): PlainYearMonth {
  plainYearMonthSlotsMap.set(instance, slots)
  attachDebugString(instance as PlainYearMonth)
  return instance as PlainYearMonth
}
