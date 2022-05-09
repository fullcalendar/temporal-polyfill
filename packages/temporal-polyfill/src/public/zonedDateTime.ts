import { Temporal } from 'temporal-spec'
import { getCommonCalendar, getStrangerCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { parseDisambigOption } from '../argParse/disambig'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OFFSET_DISPLAY_AUTO, parseOffsetDisplayOption } from '../argParse/offsetDisplay'
import {
  OFFSET_PREFER,
  OFFSET_REJECT,
  OffsetHandlingInt,
  parseOffsetHandlingOption,
} from '../argParse/offsetHandling'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { RoundingConfig, parseRoundingOptions } from '../argParse/roundingOptions'
import { parseTimeZoneDisplayOption } from '../argParse/timeZoneDisplay'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareEpochObjs, zonedDateTimesEqual } from '../dateUtils/compare'
import { DayTimeUnit, zeroISOTimeFields } from '../dateUtils/dayAndTime'
import { diffDateTimes } from '../dateUtils/diff'
import { DurationFields, negateDuration } from '../dateUtils/durationFields'
import { epochNanoSymbol, epochNanoToISOFields } from '../dateUtils/epoch'
import {
  processZonedDateTimeFromFields,
  processZonedDateTimeWithFields,
} from '../dateUtils/fromAndWith'
import { validateDateTime } from '../dateUtils/isoFieldValidation'
import { ISODateTimeFields } from '../dateUtils/isoFields'
import {
  formatCalendarID,
  formatDateTimeISO,
  formatOffsetISO,
  formatTimeZoneID,
} from '../dateUtils/isoFormat'
import { LocalTimeFields } from '../dateUtils/localFields'
import {
  ComputedEpochFields,
  DateCalendarFields,
  attachStringTag,
  dateCalendarFields,
  mixinCalendarFields,
  mixinEpochFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import {
  OffsetComputableFields,
  computeNanoInDay,
  computeZonedDateTimeEpochNano,
} from '../dateUtils/offset'
import { parseZonedDateTime } from '../dateUtils/parse'
import { refineZonedObj } from '../dateUtils/parseRefine'
import { roundZonedDateTimeFields } from '../dateUtils/rounding'
import { getInstantFor } from '../dateUtils/timeZone'
import { translateZonedDateTimeFields } from '../dateUtils/translate'
import {
  DAY,
  DayTimeUnitInt,
  HOUR,
  NANOSECOND,
  UnitInt,
  YEAR,
  nanoInHour,
} from '../dateUtils/units'
import { createZonedFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { LargeInt, LargeIntArg, createLargeInt } from '../utils/largeInt'
import { roundToMinute } from '../utils/math'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, DurationArg, createDuration } from './duration'
import { Instant } from './instant'
import { PlainDate, PlainDateArg, createDate } from './plainDate'
import { createDateTime } from './plainDateTime'
import { PlainTime, PlainTimeArg, createTime } from './plainTime'
import { createYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'

export type ZonedDateTimeArg = Temporal.ZonedDateTime | Temporal.ZonedDateTimeLike | string

type DiffOptions = Temporal.DifferenceOptions<
'year' | 'month' | 'week' | 'day' |
'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
>

type RoundOptions = Temporal.RoundTo<
'day' | 'hour' | 'minute' | 'second' |
'millisecond' | 'microsecond' | 'nanosecond'
>

const offsetNanoSymbol = Symbol()

export interface ZonedDateTime {
  [offsetNanoSymbol]: number
  [epochNanoSymbol]: LargeInt
}
export class ZonedDateTime extends AbstractISOObj<Temporal.ZonedDateTimeISOFields>
  implements Temporal.ZonedDateTime {
  constructor(
    epochNanoseconds: LargeIntArg,
    timeZoneArg: Temporal.TimeZoneLike,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
  ) {
    // TODO: throw error when number?
    const timeZone = ensureObj(TimeZone, timeZoneArg)
    const calendar = ensureObj(Calendar, calendarArg)

    const epochNano = createLargeInt(epochNanoseconds) // TODO: do strict, like Instant?
    const [isoFields, offsetNano] = buildZonedDateTimeISOFields(epochNano, timeZone)
    validateDateTime(isoFields, calendar.toString())

    super({
      ...isoFields,
      calendar,
      timeZone,
      // NOTE: must support TimeZone protocols that don't implement getOffsetStringFor
      // TODO: more DRY with getOffsetStringFor
      offset: formatOffsetISO(offsetNano),
    })

    this[epochNanoSymbol] = epochNano
    this[offsetNanoSymbol] = offsetNano
  }

  // okay to have return-type be ZonedDateTime? needed
  static from(arg: ZonedDateTimeArg, options?: Temporal.AssignmentOptions): ZonedDateTime {
    const offsetHandling = parseOffsetHandlingOption(options, OFFSET_REJECT)
    const overflowHandling = parseOverflowOption(options)

    if (arg instanceof ZonedDateTime) {
      return new ZonedDateTime(arg.epochNanoseconds, arg.timeZone, arg.calendar)
    }

    const isObject = typeof arg === 'object'
    const fields = isObject
      ? processZonedDateTimeFromFields(arg, overflowHandling, options)
      : refineZonedObj(parseZonedDateTime(String(arg)))

    return createZonedDateTimeFromFields(
      fields,
      !isObject, // fuzzyMatching (if string)
      offsetHandling,
      options,
    )
  }

  static compare(a: ZonedDateTimeArg, b: ZonedDateTimeArg): Temporal.ComparisonResult {
    return compareEpochObjs(
      ensureObj(ZonedDateTime, a),
      ensureObj(ZonedDateTime, b),
    )
  }

  get timeZone(): Temporal.TimeZoneProtocol { return this.getISOFields().timeZone }
  get offsetNanoseconds(): number { return this[offsetNanoSymbol] }
  get offset(): string { return this.getISOFields().offset }

  with(
    fields: Temporal.ZonedDateTimeLike,
    options?: Temporal.AssignmentOptions,
  ): Temporal.ZonedDateTime {
    parseDisambigOption(options) // for validation
    const overflowHandling = parseOverflowOption(options) // for validation (?)
    const offsetHandling = parseOffsetHandlingOption(options, OFFSET_PREFER)
    const refined = processZonedDateTimeWithFields(this, fields, overflowHandling, options)

    return createZonedDateTimeFromFields(refined, false, offsetHandling, options)
  }

  withPlainDate(dateArg: PlainDateArg): Temporal.ZonedDateTime {
    const date = ensureObj(PlainDate, dateArg)
    const dateTime = date.toPlainDateTime(this) // timeArg=this
    const { timeZone } = this
    const instant = getInstantFor(timeZone, dateTime)

    return new ZonedDateTime(
      instant.epochNanoseconds,
      timeZone,
      getStrangerCalendar(this, date),
    )
  }

  withPlainTime(timeArg?: PlainTimeArg): Temporal.ZonedDateTime {
    return createZonedDateTimeFromFields({
      ...this.getISOFields(),
      ...(
        timeArg === undefined
          ? zeroISOTimeFields
          : ensureObj(PlainTime, timeArg).getISOFields()
      ),
    })
  }

  withCalendar(calendarArg: Temporal.CalendarLike): Temporal.ZonedDateTime {
    return new ZonedDateTime(
      this.epochNanoseconds,
      this.timeZone,
      calendarArg,
    )
  }

  withTimeZone(timeZoneArg: Temporal.TimeZoneLike): Temporal.ZonedDateTime {
    return new ZonedDateTime(
      this.epochNanoseconds,
      timeZoneArg,
      this.calendar,
    )
  }

  add(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.ZonedDateTime {
    return translateZonedDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.ZonedDateTime {
    return translateZonedDateTime(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: ZonedDateTimeArg, options?: DiffOptions): Temporal.Duration {
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), false, options)
  }

  since(other: ZonedDateTimeArg, options?: DiffOptions): Temporal.Duration {
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), true, options)
  }

  round(options: RoundOptions): Temporal.ZonedDateTime {
    const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
      options,
      NANOSECOND, // minUnit
      DAY, // maxUnit
    )

    return roundZonedDateTime(this, roundingConfig)
  }

  equals(other: ZonedDateTimeArg): boolean {
    return zonedDateTimesEqual(this, ensureObj(ZonedDateTime, other))
  }

  startOfDay(): Temporal.ZonedDateTime {
    return createZonedDateTimeFromFields({
      ...this.getISOFields(),
      ...zeroISOTimeFields,
      offsetNanoseconds: this.offsetNanoseconds,
    }, false, OFFSET_PREFER)
  }

  // TODO: turn into a lazy-getter, like what mixinCalendarFields does
  get hoursInDay(): number {
    return computeNanoInDay(this.getISOFields()) / nanoInHour
  }

  toString(options?: Temporal.CalendarTypeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const offsetDisplay = parseOffsetDisplayOption(options)
    const timeZoneDisplay = parseTimeZoneDisplayOption(options)
    const calendarDisplay = parseCalendarDisplayOption(options)
    const roundedZdt = roundZonedDateTime(this, formatConfig)

    return formatDateTimeISO(roundedZdt.getISOFields(), formatConfig) +
      (offsetDisplay === OFFSET_DISPLAY_AUTO
        ? formatOffsetISO(roundToMinute(roundedZdt.offsetNanoseconds))
        : ''
      ) +
      formatTimeZoneID(this.timeZone.toString(), timeZoneDisplay) +
      formatCalendarID(this.calendar.toString(), calendarDisplay)
  }

  toPlainYearMonth(): Temporal.PlainYearMonth { return createYearMonth(this.getISOFields()) }
  toPlainMonthDay(): Temporal.PlainMonthDay { return this.calendar.monthDayFromFields(this) }
  toPlainDateTime(): Temporal.PlainDateTime { return createDateTime(this.getISOFields()) }
  toPlainDate(): Temporal.PlainDate { return createDate(this.getISOFields()) }
  toPlainTime(): Temporal.PlainTime { return createTime(this.getISOFields()) }
  toInstant(): Temporal.Instant { return new Instant(this.epochNanoseconds) }
}

// mixins
export interface ZonedDateTime { [Symbol.toStringTag]: 'Temporal.ZonedDateTime' }
export interface ZonedDateTime extends DateCalendarFields { calendar: Temporal.CalendarProtocol }
export interface ZonedDateTime extends LocalTimeFields {}
export interface ZonedDateTime extends ComputedEpochFields {}
export interface ZonedDateTime extends ToLocaleStringMethods {}
attachStringTag(ZonedDateTime, 'ZonedDateTime')
mixinISOFields(ZonedDateTime, timeUnitNames)
mixinCalendarFields(ZonedDateTime, dateCalendarFields)
mixinEpochFields(ZonedDateTime)
mixinLocaleStringMethods(ZonedDateTime, createZonedFormatFactoryFactory({
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: undefined,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
}, {
  timeZoneName: 'short',
}, {}))

export function createZonedDateTimeFromFields(
  fields: OffsetComputableFields,
  fuzzyMatching?: boolean,
  offsetHandling?: OffsetHandlingInt,
  disambigOptions?: Temporal.AssignmentOptions,
): ZonedDateTime {
  const epochNano = computeZonedDateTimeEpochNano(
    fields,
    fuzzyMatching,
    offsetHandling,
    disambigOptions,
  )
  return new ZonedDateTime(epochNano, fields.timeZone, fields.calendar)
}

export function buildZonedDateTimeISOFields(
  epochNano: LargeInt,
  timeZone: Temporal.TimeZoneProtocol,
): [ISODateTimeFields, number] {
  const instant = new Instant(epochNano) // will do validation
  const offsetNano = timeZone.getOffsetNanosecondsFor(instant)
  const isoFields = epochNanoToISOFields(epochNano.add(offsetNano))
  return [isoFields, offsetNano]
}

function translateZonedDateTime(
  zdt: ZonedDateTime,
  dur: DurationFields,
  options: Temporal.ArithmeticOptions | undefined,
): ZonedDateTime {
  const isoFields = zdt.getISOFields()
  const epochNano = translateZonedDateTimeFields(isoFields, dur, options)
  return new ZonedDateTime(epochNano, isoFields.timeZone, isoFields.calendar)
}

function roundZonedDateTime(
  zdt: ZonedDateTime,
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): ZonedDateTime {
  const isoFields = zdt.getISOFields()
  const epochNano = roundZonedDateTimeFields(isoFields, zdt.offsetNanoseconds, roundingConfig)
  return new ZonedDateTime(epochNano, isoFields.timeZone, isoFields.calendar)
}

// TODO: make common util with PlainDateTime, because leverages same diffDateTimes?
function diffZonedDateTimes(
  dt0: ZonedDateTime,
  dt1: ZonedDateTime,
  flip: boolean,
  options: DiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<Temporal.DateTimeUnit, UnitInt>(
    options,
    HOUR, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )
  const { largestUnit } = diffConfig

  if (largestUnit >= DAY && dt0.timeZone.id !== dt1.timeZone.id) {
    throw new Error('Must be same timeZone')
  }

  return createDuration(
    diffDateTimes(dt0, dt1, getCommonCalendar(dt0, dt1), flip, diffConfig),
  )
}
