import type { Temporal } from 'temporal-spec'
import { PlainMonthDayBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import { monthDayFieldGetters } from '../../apiHelpers/mixins'
import {
  CalendarImpl,
  getCalendarSlotId,
  isoCalendarImpl,
} from '../../internal/calendarImpl'
import { toIntegerWithTruncation } from '../../internal/cast'
import { plainMonthDaysEqual } from '../../internal/compare'
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
import {
  isoEpochFirstLeapYear,
  validateIsoDateFields,
} from '../../internal/isoCalendarMath'
import { formatPlainMonthDayIso } from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { createDateSlots } from '../../internal/slots'
import { checkIsoDateInBounds } from '../../internal/temporalLimits'
import { isObjectLike } from '../../internal/utils'
import { extractCalendarFromBag } from './calendarArg'
import { resolveAnyCalendarArg, resolveAnyCalendarId } from './calendarResolve'
import { PlainDate, createPlainDate } from './plainDate'
import { validateBag } from './temporalSlots'

export type PlainMonthDayArg = PlainMonthDay | MonthDayLikeObject | string

type PlainMonthDaySlots = CalendarDateFields & { calendar: CalendarImpl }

const plainMonthDaySlotsMap = new WeakMap<object, PlainMonthDaySlots>()

export type PlainMonthDay = InstanceType<typeof PlainMonthDay>
export const PlainMonthDay = defineTemporalClass(
  PlainMonthDayBranding,
  class {
    constructor(
      isoMonth: number,
      isoDay: number,
      calendar: string | undefined = undefined,
      referenceIsoYear?: number,
    ) {
      const isoMonthInt = toIntegerWithTruncation(isoMonth)
      const isoDayInt = toIntegerWithTruncation(isoDay)
      const calendarImpl = resolveAnyCalendarArg(calendar)
      const isoYearInt = toIntegerWithTruncation(
        referenceIsoYear ?? isoEpochFirstLeapYear,
      )
      const fields = checkIsoDateInBounds(
        validateIsoDateFields({
          year: isoYearInt,
          month: isoMonthInt,
          day: isoDayInt,
        }),
      )
      initPlainMonthDay(this, createDateSlots(fields, calendarImpl))
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

    with(
      mod: Partial<MonthDayFields>,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainMonthDay {
      return createPlainMonthDay(
        mergePlainMonthDayFields(
          getPlainMonthDaySlots(this),
          validateBag(mod),
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
        convertPlainMonthDayToDate(
          slots.calendar,
          this as unknown as PlainMonthDay,
          bag,
        ),
      )
    }

    toLocaleString(
      locales: LocalesArg | undefined = undefined,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const slots = getPlainMonthDaySlots(this)
      const format = new RawDateTimeFormat(
        locales,
        applyPlainFormatTimeZone(transformMonthDayOptions(options)),
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
  getPlainMonthDaySlots,
  monthDayFieldGetters,
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

  const res = parsePlainMonthDay(arg, resolveAnyCalendarId)
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
