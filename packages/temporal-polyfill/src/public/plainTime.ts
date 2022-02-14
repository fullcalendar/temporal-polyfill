import { timeFieldMap } from '../argParse/fieldStr'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { formatTimeISO } from '../dateUtils/isoFormat'
import { mixinISOFields } from '../dateUtils/mixins'
import { parseTimeISO } from '../dateUtils/parse'
import { roundTime } from '../dateUtils/rounding'
import {
  TimeFields,
  addToPlainTime,
  compareTimes,
  constrainTimeISO,
  createTime,
  diffPlainTimes,
  overrideTimeFields,
  roundPlainTime,
  timeFieldsToConstrainedISO,
  timeFieldsToNano,
  timeLikeToISO,
} from '../dateUtils/time'
import { nanoInMilliBI } from '../dateUtils/units'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
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
  TimeRoundingOptions,
  TimeToStringOptions,
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
          ? timeFieldsToConstrainedISO(refineFields(arg, timeFieldMap), overflowHandling)
          : parseTimeISO(String(arg)),
    )
  }

  static compare(a: TimeArg, b: TimeArg): CompareResult {
    return compareTimes(ensureObj(PlainTime, a), ensureObj(PlainTime, b))
  }

  with(fields: TimeLike, options?: OverflowOptions): PlainTime {
    const refinedFields = refineOverrideFields(fields, timeFieldMap)
    const mergedFields = overrideTimeFields(refinedFields, this)
    return createTime(
      timeFieldsToConstrainedISO(mergedFields, parseOverflowOption(options)),
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

  round(options: TimeRoundingOptions): PlainTime {
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

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locales, {
      ...options,
      timeZone: 'UTC', // options can't override
      // TODO: inject more options to ensure only time is displayed by default
    }).format(
      Number(timeFieldsToNano(this) / nanoInMilliBI),
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
