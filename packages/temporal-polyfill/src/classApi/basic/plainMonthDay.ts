import type { Temporal } from 'temporal-spec'
import { PlainMonthDayBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import {
  computeCalendarDateFields,
  computeCalendarMonthCode,
} from '../../internal/calendarDerived'
import {
  CalendarImpl,
  getCalendarSlotId,
  isoCalendarImpl,
} from '../../internal/calendarImpl'
import { plainMonthDaysEqual } from '../../internal/compare'
import { constructMonthDaySlots } from '../../internal/construct'
import { convertPlainMonthDayToDate } from '../../internal/convert'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import {
  CalendarDateFields,
  MonthDayFields,
  MonthDayLikeObject,
  YearFields,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformMonthDayOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { isObjectLike } from '../../internal/utils'
import { extractCalendarFromBag } from './calendarArg'
import {
  resolveBasicCalendarArg,
  resolveBasicCalendarId,
} from './calendarResolve'
import { PlainDate, createPlainDate } from './plainDate'
import { rejectInvalidBag } from './temporalSlots'

export type PlainMonthDayArg = PlainMonthDay | MonthDayLikeObject | string

type PlainMonthDaySlots = CalendarDateFields & { calendar: CalendarImpl }

const plainMonthDaySlotsMap = new WeakMap<object, PlainMonthDaySlots>()

export type PlainMonthDay = InstanceType<typeof PlainMonthDay>
export const PlainMonthDay = defineTemporalClass(
  PlainMonthDayBranding,
  class implements MonthDayFields {
    constructor(
      isoMonth: number,
      isoDay: number,
      calendar: string | undefined = undefined,
      referenceIsoYear?: number,
    ) {
      initPlainMonthDay(
        this,
        constructMonthDaySlots(
          resolveBasicCalendarArg,
          isoMonth,
          isoDay,
          calendar,
          referenceIsoYear,
        ),
      )
    }

    static from(
      arg: PlainMonthDayArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainMonthDay {
      return createPlainMonthDay(toPlainMonthDaySlots(arg, options))
    }

    get calendarId(): string {
      return getCalendarSlotId(getPlainMonthDaySlots(this).calendar)
    }

    get month(): number {
      const slots = getPlainMonthDaySlots(this)
      return computeCalendarDateFields(slots.calendar, slots).month
    }

    get monthCode(): string {
      const slots = getPlainMonthDaySlots(this)
      return computeCalendarMonthCode(slots.calendar, slots)
    }

    get day(): number {
      const slots = getPlainMonthDaySlots(this)
      return computeCalendarDateFields(slots.calendar, slots).day
    }

    with(
      mod: Partial<MonthDayFields>,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainMonthDay {
      return createPlainMonthDay(
        mergePlainMonthDayFields(
          getPlainMonthDaySlots(this),
          rejectInvalidBag(mod),
          options,
        ),
      )
    }

    equals(otherArg: PlainMonthDayArg): boolean {
      return plainMonthDaysEqual(
        getPlainMonthDaySlots(this),
        toPlainMonthDaySlots(otherArg),
      )
    }

    toPlainDate(bag: YearFields): PlainDate {
      const slots = getPlainMonthDaySlots(this)
      return createPlainDate(
        convertPlainMonthDayToDate(slots.calendar, this, bag),
      )
    }

    toLocaleString(
      locales: LocalesArg | undefined = undefined,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const slots = getPlainMonthDaySlots(this)
      const format = new RawDateTimeFormat(
        locales,
        applyPlainFormatTimeZone(
          transformMonthDayOptions(options, /* allowPartialOverlap = */ false),
        ),
      )
      checkResolvedCalendarCompatible(format, slots, true)
      return format.format(isoDateToEpochMilli(slots))
    }

    toString(
      options: Temporal.PlainDateToStringOptions | undefined = undefined,
    ): string {
      return formatPlainMonthDayIso(getPlainMonthDaySlots(this), options)
    }

    toJSON(): string {
      return formatPlainMonthDayIso(getPlainMonthDaySlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
)

export function createPlainMonthDay(slots: PlainMonthDaySlots): PlainMonthDay {
  return initPlainMonthDay(Object.create(PlainMonthDay.prototype), slots)
}

export function getPlainMonthDaySlots(obj: unknown): PlainMonthDaySlots {
  return getPlainMonthDaySlotsIfPresent(obj) || invalidRecordType()
}

export function getPlainMonthDaySlotsIfPresent(
  obj: unknown,
): PlainMonthDaySlots | undefined {
  return plainMonthDaySlotsMap.get(obj as object)
}

export function toPlainMonthDaySlots(
  arg: PlainMonthDayArg,
  options?: Temporal.OverflowOptions,
): PlainMonthDaySlots {
  if (isObjectLike(arg)) {
    const ownSlots = getPlainMonthDaySlotsIfPresent(arg)

    if (ownSlots) {
      refineOverflowOptions(options) // parse unused options
      return ownSlots
    }

    const calendarMaybe = extractCalendarFromBag(arg as { calendar?: any })
    const calendar =
      calendarMaybe === undefined ? isoCalendarImpl : calendarMaybe

    return refinePlainMonthDayObjectLike(
      calendar,
      calendarMaybe === undefined,
      arg as Partial<MonthDayFields>,
      options,
    )
  }

  const res = parsePlainMonthDay(arg, resolveBasicCalendarId)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainMonthDay(
  instance: object,
  slots: PlainMonthDaySlots,
): PlainMonthDay {
  plainMonthDaySlotsMap.set(instance, slots)
  attachDebugString(instance as PlainMonthDay)
  return instance as PlainMonthDay
}
