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
import { negateDuration } from '../dateUtils/durationFields'
import { processTimeFromFields, processTimeWithFields } from '../dateUtils/fromAndWith'
import { formatTimeISO } from '../dateUtils/isoFormat'
import { mixinISOFields } from '../dateUtils/mixins'
import { parseTime } from '../dateUtils/parse'
import { roundTime } from '../dateUtils/rounding'
import { translateTime } from '../dateUtils/translate'
import { DurationFields, ISOTimeFields, LocalTimeFields } from '../dateUtils/typesPrivate'
import { HOUR, NANOSECOND, TimeUnitInt, nanoInMilli } from '../dateUtils/units'
import { FormatFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, createDuration } from './duration'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { TimeZone } from './timeZone'
import {
  CompareResult,
  DateArg,
  DurationArg,
  OverflowOptions,
  TimeArg,
  TimeDiffOptions,
  TimeISOFields,
  TimeLike,
  TimeRoundingOptions,
  TimeToStringOptions,
  TimeUnit,
  TimeZoneArg,
} from './types'
import { ZonedDateTime, createZonedDateTimeFromFields } from './zonedDateTime'

export class PlainTime extends AbstractISOObj<TimeISOFields> {
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

  static from(arg: TimeArg, options?: OverflowOptions): PlainTime {
    const overflowHandling = parseOverflowOption(options)

    return createTime(
      arg instanceof PlainTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? processTimeFromFields(arg, overflowHandling)
          : parseTime(String(arg)),
    )
  }

  static compare(a: TimeArg, b: TimeArg): CompareResult {
    return compareTimes(ensureObj(PlainTime, a), ensureObj(PlainTime, b))
  }

  with(fields: TimeLike, options?: OverflowOptions): PlainTime {
    return createTime(
      processTimeWithFields(this, fields, parseOverflowOption(options)),
    )
  }

  add(durationArg: DurationArg): PlainTime {
    return translatePlainTime(this, ensureObj(Duration, durationArg))
  }

  subtract(durationArg: DurationArg): PlainTime {
    return translatePlainTime(this, negateDuration(ensureObj(Duration, durationArg)))
  }

  until(other: TimeArg, options?: TimeDiffOptions): Duration {
    return diffPlainTimes(this, ensureObj(PlainTime, other), options)
  }

  since(other: TimeArg, options?: TimeDiffOptions): Duration {
    return diffPlainTimes(ensureObj(PlainTime, other), this, options)
  }

  round(options: TimeRoundingOptions | TimeUnit): PlainTime {
    const roundingConfig = parseRoundingOptions<TimeUnit, TimeUnitInt>(
      options,
      undefined, // no default. required
      NANOSECOND, // minUnit
      HOUR, // maxUnit
    )

    return createTime(roundTime(this.getISOFields(), roundingConfig))
  }

  equals(other: TimeArg): boolean {
    return !compareTimes(this, ensureObj(PlainTime, other))
  }

  toString(options?: TimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const roundedISOFields: ISOTimeFields = roundTime(this.getISOFields(), formatConfig)
    return formatTimeISO(roundedISOFields, formatConfig)
  }

  toZonedDateTime(options: { plainDate: DateArg, timeZone: TimeZoneArg }): ZonedDateTime {
    // TODO: ensure options object first?
    const plainDate = ensureObj(PlainDate, options.plainDate)
    const timeZone = ensureObj(TimeZone, options.timeZone)

    return createZonedDateTimeFromFields({
      ...plainDate.getISOFields(),
      ...this.getISOFields(),
      timeZone,
    })
  }

  toPlainDateTime(dateArg: DateArg): PlainDateTime {
    return ensureObj(PlainDate, dateArg).toPlainDateTime(this)
  }
}

// mixin
export interface PlainTime extends LocalTimeFields { calendar: Calendar }
export interface PlainTime extends ToLocaleStringMethods {}
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
export function ensureLooseTime(arg: TimeArg | undefined): PlainTime {
  return ensureObj(PlainTime, arg ?? { hour: 0 })
}

function translatePlainTime(pt: PlainTime, dur: DurationFields): PlainTime {
  return createTime(translateTime(pt.getISOFields(), dur))
}

function diffPlainTimes(
  pt0: PlainTime,
  pt1: PlainTime,
  options: TimeDiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<TimeUnit, TimeUnitInt>(
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
