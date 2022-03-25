import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { processTimeFromFields, processTimeWithFields } from '../dateUtils/fromAndWith'
import { formatTimeISO } from '../dateUtils/isoFormat'
import { mixinISOFields } from '../dateUtils/mixins'
import { parseTime } from '../dateUtils/parse'
import { roundTime } from '../dateUtils/rounding'
import {
  TimeFields,
  addToPlainTime,
  compareTimes,
  constrainTimeISO,
  createTime,
  diffPlainTimes,
  roundPlainTime,
  timeFieldsToNano,
  timeLikeToISO,
} from '../dateUtils/time'
import { nanoInMilliBI } from '../dateUtils/units'
import { FormatFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { OrigDateTimeFormat } from '../native/intlUtils'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
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
import { ZonedDateTime } from './zonedDateTime'

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
    return addToPlainTime(this, ensureObj(Duration, durationArg))
  }

  subtract(durationArg: DurationArg): PlainTime {
    return addToPlainTime(this, ensureObj(Duration, durationArg).negated())
  }

  until(other: TimeArg, options?: TimeDiffOptions): Duration {
    return diffPlainTimes(this, ensureObj(PlainTime, other), options)
  }

  since(other: TimeArg, options?: TimeDiffOptions): Duration {
    return diffPlainTimes(ensureObj(PlainTime, other), this, options)
  }

  round(options: TimeRoundingOptions | TimeUnit): PlainTime {
    return roundPlainTime(this, options)
  }

  equals(other: TimeArg): boolean {
    return compareTimes(this, ensureObj(PlainTime, other)) === 0
  }

  toString(options?: TimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const roundedISOFields = roundTime(
      this,
      formatConfig.roundingIncrement,
      formatConfig.roundingMode,
    )
    return formatTimeISO(timeLikeToISO(roundedISOFields), formatConfig)
  }

  toZonedDateTime(options: { plainDate: DateArg, timeZone: TimeZoneArg }): ZonedDateTime {
    return this.toPlainDateTime(options.plainDate).toZonedDateTime(options.timeZone)
  }

  toPlainDateTime(dateArg: DateArg): PlainDateTime {
    return ensureObj(PlainDate, dateArg).toPlainDateTime(this)
  }
}

// mixin
export interface PlainTime extends TimeFields { calendar: Calendar }
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
      Number(timeFieldsToNano(plainTime) / nanoInMilliBI)
    ),
  }
}
