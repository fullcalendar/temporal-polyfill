import { Temporal } from 'temporal-spec'
import { parseDiffOptions } from '../argParse/diffOptions'
import { toString } from '../argParse/fieldStr'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { isObjectLike } from '../argParse/refine'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { timeUnitNames } from '../argParse/unitStr'
import {
  IsoMasterMethods,
  ensureObj,
  initIsoMaster,
  mixinIsoMasterMethods,
  needReceiver,
} from '../dateUtils/abstract'
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
import { PlainDateTime } from './plainDateTime'
import { TimeZone } from './timeZone'
import { ZonedDateTime, createZonedDateTimeFromFields } from './zonedDateTime'

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

export class PlainTime implements Temporal.PlainTime {
  constructor(
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
    isoMicrosecond = 0,
    isoNanosecond = 0,
  ) {
    initIsoMaster(this, {
      ...constrainTimeISO({
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        isoMicrosecond,
        isoNanosecond,
      }, OVERFLOW_REJECT),
      calendar: createDefaultCalendar(),
    })
  }

  static from(arg: PlainTimeArg, options?: Temporal.AssignmentOptions): Temporal.PlainTime {
    const overflowHandling = parseOverflowOption(options)

    if (
      arg instanceof PlainTime ||
      arg instanceof PlainDateTime ||
      arg instanceof ZonedDateTime
    ) {
      return createTime(arg.getISOFields())
    }
    if (isObjectLike(arg)) {
      return createTime(processTimeFromFields(arg, overflowHandling))
    }

    // parse as string...
    return createTime(parseTime(toString(arg)))
  }

  static compare(a: PlainTimeArg, b: PlainTimeArg): Temporal.ComparisonResult {
    return compareTimes(ensureObj(PlainTime, a), ensureObj(PlainTime, b))
  }

  with(fields: Temporal.PlainTimeLike, options?: Temporal.AssignmentOptions): Temporal.PlainTime {
    needReceiver(PlainTime, this)
    return createTime(
      processTimeWithFields(this, fields, parseOverflowOption(options)),
    )
  }

  add(durationArg: Temporal.Duration | Temporal.DurationLike | string): Temporal.PlainTime {
    needReceiver(PlainTime, this)
    return translatePlainTime(this, ensureObj(Duration, durationArg))
  }

  subtract(durationArg: Temporal.Duration | Temporal.DurationLike | string): Temporal.PlainTime {
    needReceiver(PlainTime, this)
    return translatePlainTime(this, negateDuration(ensureObj(Duration, durationArg)))
  }

  until(other: PlainTimeArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(PlainTime, this)
    return diffPlainTimes(this, ensureObj(PlainTime, other), options)
  }

  since(other: PlainTimeArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(PlainTime, this)
    return diffPlainTimes(ensureObj(PlainTime, other), this, options)
  }

  round(options: RoundOptions): Temporal.PlainTime {
    needReceiver(PlainTime, this)

    const roundingConfig = parseRoundingOptions<Temporal.TimeUnit, TimeUnitInt>(
      options,
      NANOSECOND, // minUnit
      HOUR, // maxUnit
    )

    return createTime(roundTime(this.getISOFields(), roundingConfig))
  }

  equals(other: Temporal.PlainTime | Temporal.PlainTimeLike | string): boolean {
    needReceiver(PlainTime, this)
    return !compareTimes(this, ensureObj(PlainTime, other))
  }

  toString(options?: Temporal.ToStringPrecisionOptions): string {
    needReceiver(PlainTime, this)
    const formatConfig = parseTimeToStringOptions(options)
    const roundedISOFields: ISOTimeFields = roundTime(this.getISOFields(), formatConfig)
    return formatTimeISO(roundedISOFields, formatConfig)
  }

  toZonedDateTime(options: ToZonedDateTimeOptions): Temporal.ZonedDateTime {
    needReceiver(PlainTime, this)

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
    needReceiver(PlainTime, this)
    return ensureObj(PlainDate, dateArg).toPlainDateTime(this)
  }
}

// mixins
export interface PlainTime extends IsoMasterMethods<Temporal.PlainTimeISOFields> {}
mixinIsoMasterMethods(PlainTime)
//
export interface PlainTime { [Symbol.toStringTag]: 'Temporal.PlainTime' }
attachStringTag(PlainTime, 'PlainTime')
//
export interface PlainTime extends LocalTimeFields { calendar: Temporal.Calendar }
mixinISOFields(PlainTime, timeUnitNames)
//
export interface PlainTime extends ToLocaleStringMethods {}
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
