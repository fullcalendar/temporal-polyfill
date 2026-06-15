import type { Temporal } from 'temporal-spec'
import { ZonedDateTimeBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from '../../apiHelpers/classStyle'
import {
  calendarDerivedGetters,
  calendarFieldGetters,
  timeGetters,
} from '../../apiHelpers/mixins'
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toBigInt } from '../../internal/cast'
import {
  compareZonedDateTimes,
  zonedDateTimesEqual,
} from '../../internal/compare'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../../internal/convert'
import { refineZonedDateTimeObjectLike } from '../../internal/createFromFields'
import { diffZonedDateTimes } from '../../internal/diff'
import { negateDurationFields } from '../../internal/durationMath'
import {
  DateTimeFields,
  ZonedDateTimeLikeObject,
} from '../../internal/fieldTypes'
import {
  applyZonedFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformZonedOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
} from '../../internal/isoFormat'
import { parseZonedDateTime } from '../../internal/isoParse'
import { mergeZonedDateTimeFields } from '../../internal/merge'
import { zonedDateTimeWithPlainTime } from '../../internal/modify'
import { moveZonedEpochSlots } from '../../internal/move'
import { refineZonedFieldOptions } from '../../internal/optionsFieldRefine'
import { RoundingModeEnum } from '../../internal/optionsModel'
import { refineRoundingOptions } from '../../internal/optionsRoundingRefine'
import {
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedEpochSlotsToUnit,
} from '../../internal/round'
import { getCommonCalendar, getZonedTimeZoneId } from '../../internal/slotUtils'
import {
  ZonedEpochNanoFields,
  createDurationSlots,
  createZonedEpochNanoSlots,
  getEpochMilli,
  getEpochNano,
} from '../../internal/slots'
import { checkEpochNanoInBounds } from '../../internal/temporalLimits'
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import {
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
import { DayTimeUnit } from '../../internal/units'
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
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { validateBag } from './temporalSlots'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'

export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeLikeObject | string

type ZonedDateTimeSlots = ZonedEpochNanoFields & { calendar: CalendarImpl }

const zonedDateTimeSlotsMap = new WeakMap<object, ZonedDateTimeSlots>()

export type ZonedDateTime = InstanceType<typeof ZonedDateTime>
export const ZonedDateTime = defineTemporalClass(
  ZonedDateTimeBranding,
  class {
    constructor(
      epochNanoseconds: bigint,
      timeZoneId: string,
      calendar: string | undefined = undefined,
    ) {
      const epochNano = checkEpochNanoInBounds(toBigInt(epochNanoseconds))
      const timeZone = queryTimeZone(refineTimeZoneId(timeZoneId))
      const calendarImpl = resolveBasicCalendarArg(calendar)
      initZonedDateTime(
        this,
        createZonedEpochNanoSlots(epochNano, timeZone, calendarImpl),
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

    get calendarId(): string {
      return getCalendarSlotId(getZonedDateTimeSlots(this).calendar)
    }

    get epochMilliseconds(): number {
      return getEpochMilli(getZonedDateTimeSlots(this))
    }

    get epochNanoseconds(): bigint {
      return getEpochNano(getZonedDateTimeSlots(this))
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
          validateBag(mod),
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
      const slots = getZonedDateTimeSlots(this)
      return createZonedDateTime(
        moveZonedEpochSlots(
          slots,
          toDurationSlots(durationArg),
          options === undefined ? Object.create(null) : options,
        ),
      )
    }

    subtract(
      durationArg: DurationArg,
      options: Temporal.OverflowOptions | undefined = undefined,
    ): ZonedDateTime {
      const slots = getZonedDateTimeSlots(this)
      return createZonedDateTime(
        moveZonedEpochSlots(
          slots,
          negateDurationFields(toDurationSlots(durationArg)),
          options === undefined ? Object.create(null) : options,
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
      const slots = getZonedDateTimeSlots(this)
      const [smallestUnit, roundingInc, roundingMode] = refineRoundingOptions(
        options,
      ) as [DayTimeUnit, number, RoundingModeEnum]
      return createZonedDateTime(
        roundZonedEpochSlotsToUnit(
          slots,
          smallestUnit,
          roundingInc,
          roundingMode,
        ),
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
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const slots = getZonedDateTimeSlots(this)
      const format = new RawDateTimeFormat(
        locales,
        applyZonedFormatTimeZone(
          transformZonedOptions(options, /* allowPartialOverlap = */ false),
          getZonedTimeZoneId(slots),
        ),
      )
      checkResolvedCalendarCompatible(format, slots)
      return format.format(getEpochMilli(slots))
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
  },
  getZonedDateTimeIsoSlots,
  calendarFieldGetters,
  calendarDerivedGetters,
  timeGetters,
)

export function createZonedDateTime(slots: ZonedDateTimeSlots): ZonedDateTime {
  return initZonedDateTime(Object.create(ZonedDateTime.prototype), slots)
}

export function getZonedDateTimeSlots(obj: unknown): ZonedDateTimeSlots {
  return getZonedDateTimeSlotsIfPresent(obj) || invalidRecordType()
}

function getZonedDateTimeIsoSlots(obj: unknown) {
  const slots = getZonedDateTimeSlots(obj)
  return { ...zonedEpochSlotsToIso(slots), calendar: slots.calendar }
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

  return parseZonedDateTime(arg, resolveBasicCalendarId, options)
}

function initZonedDateTime(
  instance: object,
  slots: ZonedDateTimeSlots,
): ZonedDateTime {
  zonedDateTimeSlotsMap.set(instance, slots)
  attachDebugString(instance as ZonedDateTime)
  return instance as ZonedDateTime
}
