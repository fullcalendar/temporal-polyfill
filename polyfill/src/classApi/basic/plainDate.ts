import type { Temporal } from 'temporal-spec'
import { PlainDateBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import { diffDates } from '../../apiHelpers/diffHelpers'
import {
  dateDerivedGetters,
  dateFieldGetters,
} from '../../apiHelpers/gettersForSlots'
import { withDateFields } from '../../apiHelpers/withFields'
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toIntegerWithTrunc } from '../../internal/cast'
import { compareIsoDateFields, plainDatesEqual } from '../../internal/compare'
import {
  dateToZonedDateTime,
  fieldsToMonthDay,
  fieldsToYearMonth,
  zonedDateTimeToDate,
} from '../../internal/convert'
import { refinePlainDateObjectLike } from '../../internal/createFromFields'
import { negateDurationFields } from '../../internal/durationMath'
import { isoDateToEpochMilli } from '../../internal/epochMath'
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
import { validateIsoDateFields } from '../../internal/isoCalendarMath'
import { formatPlainDateIso } from '../../internal/isoFormat'
import { parsePlainDate } from '../../internal/isoParse'
import { moveDate } from '../../internal/move'
import { createDateSlots } from '../../internal/slots'
import { createDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { checkIsoDateInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { NumberSign, isObjectLike, mapProps } from '../../internal/utils'
import { refineOverflowOptions } from '../../options/fieldRefine'
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
import { validateBag } from './temporalSlots'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import {
  ZonedDateTime,
  createZonedDateTime,
  getZonedDateTimeSlotsIfPresent,
} from './zonedDateTime'

export type PlainDateArg = PlainDate | DateLikeObject | string
type PlainDateSlots = CalendarDateFields & { calendar: CalendarImpl }

const plainDateSlotsMap = new WeakMap<object, PlainDateSlots>()

export type PlainDate = InstanceType<typeof PlainDate>
export const PlainDate = defineTemporalClass(
  PlainDateBranding,
  class {
    constructor(
      isoYear: number,
      isoMonth: number,
      isoDay: number,
      calendar: string | undefined = undefined,
    ) {
      const fields = checkIsoDateInBounds(
        validateIsoDateFields(
          mapProps(toIntegerWithTrunc, {
            year: isoYear,
            month: isoMonth,
            day: isoDay,
          }),
        ),
      )
      const calendarImpl = resolveBasicCalendarArg(calendar)
      initPlainDate(this, createDateSlots(fields, calendarImpl))
    }

    static from(
      arg: any,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainDate {
      return createPlainDate(toPlainDateSlots(arg, options))
    }

    static compare(arg0: PlainDateArg, arg1: PlainDateArg): NumberSign {
      return compareIsoDateFields(
        toPlainDateSlots(arg0),
        toPlainDateSlots(arg1),
      )
    }

    get calendarId(): string {
      return getCalendarSlotId(getPlainDateSlots(this).calendar)
    }

    with(
      mod: Partial<DateFields>,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainDate {
      return createPlainDate(
        withDateFields(getPlainDateSlots(this), validateBag(mod), options),
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
      const slots = getPlainDateSlots(this)
      return createPlainDate(
        createDateSlots(
          moveDate(
            slots.calendar,
            slots,
            toDurationSlots(durationArg),
            refineOverflowOptions(options),
          ),
          slots.calendar,
        ),
      )
    }

    subtract(
      durationArg: DurationArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainDate {
      const slots = getPlainDateSlots(this)
      return createPlainDate(
        createDateSlots(
          moveDate(
            slots.calendar,
            slots,
            negateDurationFields(toDurationSlots(durationArg)),
            refineOverflowOptions(options),
          ),
          slots.calendar,
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
      return createDuration(diffDates(false, slots, other, options))
    }

    since(
      otherArg: PlainDateArg,
      options:
        | Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>
        | undefined = undefined,
    ): Duration {
      const slots = getPlainDateSlots(this)
      const other = toPlainDateSlots(otherArg)
      return createDuration(diffDates(true, slots, other, options))
    }

    equals(otherArg: PlainDateArg): boolean {
      return plainDatesEqual(
        getPlainDateSlots(this),
        toPlainDateSlots(otherArg),
      )
    }

    toZonedDateTime(
      options:
        | TimeZoneArg
        | { timeZone: TimeZoneArg; plainTime?: PlainTimeArg },
    ): ZonedDateTime {
      const optionsObj = !isObjectLike(options)
        ? { timeZone: options }
        : {
            timeZone: (options as { timeZone: TimeZoneArg }).timeZone,
            plainTime: (options as { plainTime?: PlainTimeArg }).plainTime,
          }
      const slots = getPlainDateSlots(this)
      const timeZoneId = refineTimeZoneArg(optionsObj.timeZone)
      const plainTimeArg = optionsObj.plainTime
      const timeFields =
        plainTimeArg !== undefined ? toPlainTimeSlots(plainTimeArg) : undefined
      return createZonedDateTime(
        dateToZonedDateTime(slots, queryTimeZone(timeZoneId), timeFields),
      )
    }

    toPlainDateTime(
      plainTimeArg: PlainTimeArg | undefined = undefined,
    ): PlainDateTime {
      const slots = getPlainDateSlots(this)
      return createPlainDateTime(
        createDateTimeFromRefinedFields(
          slots,
          optionalToPlainTimeFields(plainTimeArg),
          slots.calendar,
        ),
      )
    }

    toPlainYearMonth(): PlainYearMonth {
      const slots = getPlainDateSlots(this)
      return createPlainYearMonth(
        fieldsToYearMonth(slots.calendar, this as unknown as PlainDate),
      )
    }

    toPlainMonthDay(): PlainMonthDay {
      const slots = getPlainDateSlots(this)
      return createPlainMonthDay(
        fieldsToMonthDay(slots.calendar, this as unknown as PlainDate),
      )
    }

    toLocaleString(
      locales: LocalesArg | undefined = undefined,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const slots = getPlainDateSlots(this)
      const format = new RawDateTimeFormat(
        locales,
        applyPlainFormatTimeZone(transformDateOptions(options)),
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
  },
  getPlainDateSlots,
  dateFieldGetters,
  dateDerivedGetters,
)

export function createPlainDate(slots: PlainDateSlots): PlainDate {
  return initPlainDate(Object.create(PlainDate.prototype), slots)
}

export function getPlainDateSlots(obj: unknown): PlainDateSlots {
  return getPlainDateSlotsIfPresent(obj) || invalidRecordType()
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
      return zonedDateTimeToDate(zonedDateTimeSlots)
    }

    const calendar = getCalendarFromBag(arg as DateLikeObject)
    return refinePlainDateObjectLike(calendar, arg as DateLikeObject, options)
  }

  const res = parsePlainDate(arg, resolveBasicCalendarId)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainDate(instance: object, slots: PlainDateSlots): PlainDate {
  plainDateSlotsMap.set(instance, slots)
  attachDebugString(instance as PlainDate)
  return instance as PlainDate
}
