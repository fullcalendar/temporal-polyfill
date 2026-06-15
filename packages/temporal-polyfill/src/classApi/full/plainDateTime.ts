import type { Temporal } from 'temporal-spec'
import { PlainDateTimeBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import {
  dateDerivedGetters,
  dateFieldGetters,
  timeGetters,
} from '../../apiHelpers/mixins'
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toIntegerWithTrunc } from '../../internal/cast'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../../internal/compare'
import {
  plainDateTimeToZonedDateTime,
  zonedDateTimeToPlainDateTime,
} from '../../internal/convert'
import { refinePlainDateTimeObjectLike } from '../../internal/createFromFields'
import { diffPlainDateTimes } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import { isoDateTimeToEpochMilli } from '../../internal/epochMath'
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
import { validateIsoDateTimeFields } from '../../internal/isoCalendarMath'
import { formatPlainDateTimeIso } from '../../internal/isoFormat'
import { parsePlainDateTime } from '../../internal/isoParse'
import { mergePlainDateTimeFields } from '../../internal/merge'
import { moveDateTime } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { RoundingModeEnum } from '../../internal/optionsModel'
import { refineRoundingOptions } from '../../internal/optionsRoundingRefine'
import { computeNanoInc, roundDateTimeToNano } from '../../internal/round'
import { getCommonCalendar } from '../../internal/slotUtils'
import {
  createDateSlots,
  createDateTimeSlots,
  createTimeSlots,
} from '../../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../../internal/slotsFromRefinedFields'
import { checkIsoDateTimeInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { DayTimeUnit } from '../../internal/units'
import { NumberSign, isObjectLike, mapProps } from '../../internal/utils'
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
import { validateBag } from './temporalSlots'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import {
  ZonedDateTime,
  createZonedDateTime,
  getZonedDateTimeSlotsIfPresent,
} from './zonedDateTime'

export type PlainDateTimeArg = PlainDateTime | DateTimeLikeObject | string

type PlainDateTimeSlots = CalendarDateTimeFields & { calendar: CalendarImpl }

const plainDateTimeSlotsMap = new WeakMap<object, PlainDateTimeSlots>()

export type PlainDateTime = InstanceType<typeof PlainDateTime>
export const PlainDateTime = defineTemporalClass(
  PlainDateTimeBranding,
  class {
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
      const fields = checkIsoDateTimeInBounds(
        validateIsoDateTimeFields(
          mapProps(toIntegerWithTrunc, {
            year: isoYear,
            month: isoMonth,
            day: isoDay,
            hour,
            minute,
            second,
            millisecond,
            microsecond,
            nanosecond,
          }),
        ),
      )
      const calendarImpl = resolveAnyCalendarArg(calendar)
      initPlainDateTime(this, createDateTimeSlots(fields, calendarImpl))
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

    with(
      mod: Partial<DateTimeFields>,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): PlainDateTime {
      return createPlainDateTime(
        mergePlainDateTimeFields(
          getPlainDateTimeSlots(this),
          validateBag(mod),
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
      const slots = getPlainDateTimeSlots(this)
      return createPlainDateTime(
        createDateTimeSlots(
          moveDateTime(
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
    ): PlainDateTime {
      const slots = getPlainDateTimeSlots(this)
      return createPlainDateTime(
        createDateTimeSlots(
          moveDateTime(
            slots.calendar,
            slots,
            negateDurationFields(toDurationSlots(durationArg)),
            options,
          ),
          slots.calendar,
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
      const slots = getPlainDateTimeSlots(this)
      const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
        options,
      ) as [DayTimeUnit, number, RoundingModeEnum]
      return createPlainDateTime(
        createDateTimeSlots(
          roundDateTimeToNano(
            slots,
            computeNanoInc(smallestUnit, roundingInc),
            roundingMode,
          ),
          slots.calendar,
        ),
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
        applyPlainFormatTimeZone(transformDateTimeOptions(options)),
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
  },
  getPlainDateTimeSlots,
  dateFieldGetters,
  dateDerivedGetters,
  timeGetters,
)

export function createPlainDateTime(slots: PlainDateTimeSlots): PlainDateTime {
  return initPlainDateTime(Object.create(PlainDateTime.prototype), slots)
}

export function getPlainDateTimeSlots(obj: unknown): PlainDateTimeSlots {
  return getPlainDateTimeSlotsIfPresent(obj) || invalidRecordType()
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

  const res = parsePlainDateTime(arg, resolveAnyCalendarId)
  refineOverflowOptions(options) // parse unused options
  return res
}

function initPlainDateTime(
  instance: object,
  slots: PlainDateTimeSlots,
): PlainDateTime {
  plainDateTimeSlotsMap.set(instance, slots)
  attachDebugString(instance as PlainDateTime)
  return instance as PlainDateTime
}
