import { isoCalendar } from './argParse/calendar'
import { parseTimeToStringOptions } from './argParse/isoFormatOptions'
import { OVERFLOW_REJECT } from './argParse/overflowHandling'
import { refineFields } from './argParse/refine'
import { timeUnitNames } from './argParse/units'
import { AbstractISOObj, ensureObj } from './dateUtils/abstract'
import { formatTimeISO } from './dateUtils/isoFormat'
import { mixinISOFields } from './dateUtils/mixins'
import { parseTimeISO } from './dateUtils/parse'
import {
  TimeFields,
  addToPlainTime,
  constrainTimeISO,
  createTime,
  diffPlainTimes,
  overrideTimeFields,
  roundPlainTime,
  timeFieldMap,
  timeFieldsToConstrainedISO,
  timeFieldsToNano,
} from './dateUtils/time'
import { compareValues } from './utils/math'
import {
  CompareResult,
  DateArg,
  DurationArg,
  LocalesArg,
  OverflowOptions,
  TimeArg,
  TimeDiffOptions,
  TimeISOFields,
  TimeLike,
  TimeRoundOptions,
  TimeToStringOptions,
  TimeZoneArg,
} from './args'
import { Calendar } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
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
        calendar: isoCalendar,
      },
    )
  }

  static from(arg: TimeArg, options?: OverflowOptions): PlainTime {
    return createTime(
      arg instanceof PlainTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? timeFieldsToConstrainedISO(refineFields(arg, timeFieldMap), options)
          : parseTimeISO(String(arg)),
    )
  }

  static compare(a: TimeArg, b: TimeArg): CompareResult {
    return compareValues(
      timeFieldsToNano(ensureObj(PlainTime, a)),
      timeFieldsToNano(ensureObj(PlainTime, b)),
    )
  }

  with(fields: TimeLike, options?: OverflowOptions): PlainTime {
    const refinedFields = refineFields(fields, timeFieldMap)
    const mergedFields = overrideTimeFields(refinedFields, this)
    return createTime(timeFieldsToConstrainedISO(mergedFields, options))
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

  round(options: TimeRoundOptions): PlainTime {
    return roundPlainTime(this, options)
  }

  toString(options?: TimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    return formatTimeISO(this.getISOFields(), formatConfig)[0]
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locales, {
      ...options,
      timeZone: 'UTC', // options can't override
      // TODO: inject more options to ensure only time is displayed by default
    }).format(
      Math.floor(timeFieldsToNano(this) / 1000000),
    )
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
mixinISOFields(PlainTime, timeUnitNames)
