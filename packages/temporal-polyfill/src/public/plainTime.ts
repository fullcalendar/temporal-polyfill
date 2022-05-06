import { Temporal } from 'temporal-spec'
import { parseDiffOptions } from '../argParse/diffOptions'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareTimes } from '../dateUtils/compare'
import { constrainTimeISO } from '../dateUtils/constrain'
import { isoTimeToNano } from '../dateUtils/dayAndTime'
import { diffTimes } from '../dateUtils/diff'
import { DurationFields, negateDuration } from '../dateUtils/durationFields'
import { processTimeFromFields, processTimeWithFields } from '../dateUtils/fromAndWith'
import { ISOTimeFields } from '../dateUtils/isoFields'
import { formatTimeISO } from '../dateUtils/isoFormat'
import { LocalTimeFields } from '../dateUtils/localFields'
import { attachStringTag, mixinISOFields } from '../dateUtils/mixins'
import { parseTime } from '../dateUtils/parse'
import { roundTime } from '../dateUtils/rounding'
import { translateTime } from '../dateUtils/translate'
import { HOUR, NANOSECOND, TimeUnitInt, nanoInMilli } from '../dateUtils/units'
import { FormatFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { createDefaultCalendar } from './calendar'
import { Duration, createDuration } from './duration'
import { PlainDate, PlainDateArg } from './plainDate'
import { TimeZone } from './timeZone'
import { createZonedDateTimeFromFields } from './zonedDateTime'

export type PlainTimeArg = Temporal.PlainTime | Temporal.PlainTimeLike | string

type DiffOptions = Temporal.DifferenceOptions<
'hour' | 'minute' | 'second' |
'millisecond' | 'microsecond' | 'nanosecond'
>

type RoundOptions = Temporal.RoundTo<
'hour' | 'minute' | 'second' |
'millisecond' | 'microsecond' | 'nanosecond'
>

type ToZonedDateTimeOptions = {
  timeZone: Temporal.TimeZoneLike
  plainDate: Temporal.PlainDate | Temporal.PlainDateLike | string
}

export class PlainTime extends AbstractISOObj<Temporal.PlainTimeISOFields>
  implements Temporal.PlainTime {
  constructor(
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
    isoMicrosecond = 0,
    isoNanosecond = 0,
  ) {
    super(
      {
        ...constrainTimeISO({
          isoHour,
          isoMinute,
          isoSecond,
          isoMillisecond,
          isoMicrosecond,
          isoNanosecond,
        }, OVERFLOW_REJECT),
        calendar: createDefaultCalendar(),
      },
    )
  }

  static from(arg: PlainTimeArg, options?: Temporal.AssignmentOptions): Temporal.PlainTime {
    const overflowHandling = parseOverflowOption(options)

    return createTime(
      arg instanceof PlainTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? processTimeFromFields(arg, overflowHandling)
          : parseTime(String(arg)),
    )
  }

  static compare(a: PlainTimeArg, b: PlainTimeArg): Temporal.ComparisonResult {
    return compareTimes(ensureObj(PlainTime, a), ensureObj(PlainTime, b))
  }

  with(fields: Temporal.PlainTimeLike, options?: Temporal.AssignmentOptions): Temporal.PlainTime {
    return createTime(
      processTimeWithFields(this, fields, parseOverflowOption(options)),
    )
  }

  add(durationArg: Temporal.Duration | Temporal.DurationLike | string): Temporal.PlainTime {
    return translatePlainTime(this, ensureObj(Duration, durationArg))
  }

  subtract(durationArg: Temporal.Duration | Temporal.DurationLike | string): Temporal.PlainTime {
    return translatePlainTime(this, negateDuration(ensureObj(Duration, durationArg)))
  }

  until(other: PlainTimeArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainTimes(this, ensureObj(PlainTime, other), options)
  }

  since(other: PlainTimeArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainTimes(ensureObj(PlainTime, other), this, options)
  }

  round(options: RoundOptions): Temporal.PlainTime {
    const roundingConfig = parseRoundingOptions<Temporal.TimeUnit, TimeUnitInt>(
      options,
      NANOSECOND, // minUnit
      HOUR, // maxUnit
    )

    return createTime(roundTime(this.getISOFields(), roundingConfig))
  }

  equals(other: Temporal.PlainTime | Temporal.PlainTimeLike | string): boolean {
    return !compareTimes(this, ensureObj(PlainTime, other))
  }

  toString(options?: Temporal.ToStringPrecisionOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const roundedISOFields: ISOTimeFields = roundTime(this.getISOFields(), formatConfig)
    return formatTimeISO(roundedISOFields, formatConfig)
  }

  toZonedDateTime(options: ToZonedDateTimeOptions): Temporal.ZonedDateTime {
    // TODO: ensure options object first?
    const plainDate = ensureObj(PlainDate, options.plainDate)
    const timeZone = ensureObj(TimeZone, options.timeZone)

    return createZonedDateTimeFromFields({
      ...plainDate.getISOFields(),
      ...this.getISOFields(),
      timeZone,
    })
  }

  toPlainDateTime(dateArg: PlainDateArg): Temporal.PlainDateTime {
    return ensureObj(PlainDate, dateArg).toPlainDateTime(this)
  }
}

// mixin
export interface PlainTime { [Symbol.toStringTag]: 'Temporal.PlainTime' }
export interface PlainTime extends LocalTimeFields { calendar: Temporal.Calendar }
export interface PlainTime extends ToLocaleStringMethods {}
attachStringTag(PlainTime, 'PlainTime')
mixinISOFields(PlainTime, timeUnitNames)
mixinLocaleStringMethods(PlainTime, createPlainTimeFormatFactory)

function createPlainTimeFormatFactory(
  locales: string[],
  options: Intl.DateTimeFormatOptions,
): FormatFactory<PlainTime> {
  return {
    buildKey: () => ['', ''],
    buildFormat: () => new OrigDateTimeFormat(locales, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      ...options,
      timeZone: 'UTC', // options can't override
      timeZoneName: undefined,
      year: undefined,
      month: undefined,
      day: undefined,
      weekday: undefined,
    }),
    buildEpochMilli: (plainTime: PlainTime) => (
      Math.trunc(isoTimeToNano(plainTime.getISOFields()) / nanoInMilli)
    ),
  }
}

export function createTime(isoFields: ISOTimeFields): PlainTime {
  return new PlainTime(
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
  )
}

// Normally ensureObj and ::from would fail when undefined is specified
// Fallback to 00:00 time
export function ensureLooseTime(arg: PlainTimeArg | undefined): PlainTime {
  return ensureObj(PlainTime, arg ?? { hour: 0 })
}

function translatePlainTime(pt: PlainTime, dur: DurationFields): PlainTime {
  return createTime(translateTime(pt.getISOFields(), dur))
}

function diffPlainTimes(
  pt0: PlainTime,
  pt1: PlainTime,
  options: DiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<Temporal.TimeUnit, TimeUnitInt>(
    options,
    HOUR, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    HOUR, // maxUnit
  )

  return createDuration(
    // TODO: use local-time-fields as-is somehow???
    diffTimes(pt0.getISOFields(), pt1.getISOFields(), diffConfig),
  )
}
