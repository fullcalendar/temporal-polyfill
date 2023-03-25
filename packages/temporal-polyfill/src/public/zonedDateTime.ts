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
import { isObjectLike } from '../argParse/refine'
import { RoundingConfig, parseRoundingOptions } from '../argParse/roundingOptions'
import { parseTimeZoneDisplayOption } from '../argParse/timeZoneDisplay'
import { timeUnitNames } from '../argParse/unitStr'
import { ensureObj, needReceiver } from '../dateUtils/abstract'
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
import { getInstantFor, getSafeOffsetNanosecondsFor } from '../dateUtils/timeZone'
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

// Internals
// -------------------------------------------------------------------------------------------------

interface ZonedDateTimeInternals {
  epochNanoseconds: LargeInt
  timeZone: TimeZone
  calendar: Calendar
}

interface ZonedDateTimeComputeds extends ISODateTimeFields {
  offsetNanoseconds: number
  offset: string
}

export interface ZonedDateTime {
  [epochNanoSymbol]: LargeInt // for mixinEpochFields
}

const internalsMap = new WeakMap<ZonedDateTime, ZonedDateTimeInternals>()
const computedsMap = new WeakMap<ZonedDateTime, ZonedDateTimeComputeds>()

function getInternals(zdt: ZonedDateTime): ZonedDateTimeInternals {
  return internalsMap.get(zdt)!
}

export { getInternals as getZonedDateTimeInterals }

function getComputeds(zdt: ZonedDateTime): ZonedDateTimeComputeds {
  let computeds = computedsMap.get(zdt)
  if (computeds === undefined) {
    computeds = buildComputeds(getInternals(zdt))
    computedsMap.set(zdt, computeds)
  }
  return computeds
}

function buildComputeds(internals: ZonedDateTimeInternals): ZonedDateTimeComputeds {
  const [isoFields, offsetNanoseconds] = buildZonedDateTimeISOFields(
    internals.epochNanoseconds,
    internals.timeZone,
  )
  validateDateTime(isoFields, internals.calendar.toString())
  return {
    ...isoFields,
    offsetNanoseconds,
    offset: formatOffsetISO(offsetNanoseconds),
  }
}

// Public
// -------------------------------------------------------------------------------------------------

export class ZonedDateTime implements Temporal.ZonedDateTime {
  constructor(
    epochNanoseconds: LargeIntArg,
    timeZoneArg: Temporal.TimeZoneLike,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
  ) {
    const epochNano = createLargeInt(epochNanoseconds) // TODO: do strict, like Instant?
    this[epochNanoSymbol] = epochNano
    internalsMap.set(this, {
      epochNanoseconds: epochNano,
      timeZone: ensureObj(TimeZone, timeZoneArg) as TimeZone,
      calendar: ensureObj(Calendar, calendarArg) as Calendar,
    })
  }

  // okay to have return-type be ZonedDateTime? needed
  static from(arg: ZonedDateTimeArg, options?: Temporal.AssignmentOptions): ZonedDateTime {
    const offsetHandling = parseOffsetHandlingOption(options, OFFSET_REJECT)
    const overflowHandling = parseOverflowOption(options)

    if (arg instanceof ZonedDateTime) {
      return new ZonedDateTime(arg.epochNanoseconds, arg.timeZone, arg.calendar) // optimization
    }
    if (typeof arg === 'symbol') {
      throw new TypeError('cannot accept symbol')
    }

    const isObject = isObjectLike(arg)
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

  get timeZone(): Temporal.TimeZoneProtocol {
    needReceiver(ZonedDateTime, this)
    return getInternals(this).timeZone
  }

  get offsetNanoseconds(): number {
    needReceiver(ZonedDateTime, this)
    return getComputeds(this).offsetNanoseconds
  }

  get offset(): string {
    needReceiver(ZonedDateTime, this)
    return getComputeds(this).offset
  }

  with(
    fields: Temporal.ZonedDateTimeLike,
    options?: Temporal.AssignmentOptions,
  ): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)

    parseDisambigOption(options) // for validation
    const overflowHandling = parseOverflowOption(options) // for validation (?)
    const offsetHandling = parseOffsetHandlingOption(options, OFFSET_PREFER)
    const refined = processZonedDateTimeWithFields(this, fields, overflowHandling, options)

    return createZonedDateTimeFromFields(refined, false, offsetHandling, options)
  }

  withPlainDate(dateArg: PlainDateArg): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)

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
    needReceiver(ZonedDateTime, this)
    return createZonedDateTimeFromFields({
      ...getInternals(this),
      ...getComputeds(this),
      ...(
        timeArg === undefined
          ? zeroISOTimeFields
          : ensureObj(PlainTime, timeArg).getISOFields()
      ),
    })
  }

  withCalendar(calendarArg: Temporal.CalendarLike): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)
    return new ZonedDateTime(
      this.epochNanoseconds,
      this.timeZone,
      calendarArg,
    )
  }

  withTimeZone(timeZoneArg: Temporal.TimeZoneLike): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)
    return new ZonedDateTime(
      this.epochNanoseconds,
      timeZoneArg,
      this.calendar,
    )
  }

  add(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)
    return translateZonedDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)
    return translateZonedDateTime(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: ZonedDateTimeArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(ZonedDateTime, this)
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), false, options)
  }

  since(other: ZonedDateTimeArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(ZonedDateTime, this)
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), true, options)
  }

  round(options: RoundOptions): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)

    const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
      options,
      NANOSECOND, // minUnit
      DAY, // maxUnit
    )

    return roundZonedDateTime(this, roundingConfig)
  }

  equals(other: ZonedDateTimeArg): boolean {
    needReceiver(ZonedDateTime, this)
    return zonedDateTimesEqual(this, ensureObj(ZonedDateTime, other))
  }

  startOfDay(): Temporal.ZonedDateTime {
    needReceiver(ZonedDateTime, this)
    return createZonedDateTimeFromFields({
      ...getInternals(this),
      ...getComputeds(this),
      ...zeroISOTimeFields,
      offsetNanoseconds: this.offsetNanoseconds,
    }, false, OFFSET_PREFER)
  }

  // TODO: turn into a lazy-getter, like what mixinCalendarFields does
  get hoursInDay(): number {
    needReceiver(ZonedDateTime, this)
    return computeNanoInDay({
      ...getInternals(this),
      ...getComputeds(this),
    }) / nanoInHour
  }

  toString(options?: Temporal.CalendarTypeToStringOptions): string {
    needReceiver(ZonedDateTime, this)

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

  toPlainYearMonth(): Temporal.PlainYearMonth {
    needReceiver(ZonedDateTime, this)
    return createYearMonth({
      ...getInternals(this),
      ...getComputeds(this),
    })
  }

  toPlainMonthDay(): Temporal.PlainMonthDay {
    needReceiver(ZonedDateTime, this)
    return this.calendar.monthDayFromFields(this)
  }

  toPlainDateTime(): Temporal.PlainDateTime {
    needReceiver(ZonedDateTime, this)
    return createDateTime({
      ...getInternals(this),
      ...getComputeds(this),
    })
  }

  toPlainDate(): Temporal.PlainDate {
    needReceiver(ZonedDateTime, this)
    return createDate({
      ...getInternals(this),
      ...getComputeds(this),
    })
  }

  toPlainTime(): Temporal.PlainTime {
    needReceiver(ZonedDateTime, this)
    return createTime({ ...getComputeds(this) })
  }

  toInstant(): Temporal.Instant {
    needReceiver(ZonedDateTime, this)
    return new Instant(this.epochNanoseconds)
  }

  getISOFields(): Temporal.ZonedDateTimeISOFields {
    needReceiver(ZonedDateTime, this)
    return {
      ...getInternals(this),
      ...getComputeds(this),
      // TODO: remove some props right?
    }
  }

  valueOf(): never {
    needReceiver(ZonedDateTime, this)
    throw new Error('Cannot convert object using valueOf')
  }

  toJSON(): string {
    needReceiver(ZonedDateTime, this)
    return String(this) // better than .toString, looks at [Symbol.toPrimitive]
  }
}

// mixins
export interface ZonedDateTime { [Symbol.toStringTag]: 'Temporal.ZonedDateTime' }
attachStringTag(ZonedDateTime, 'ZonedDateTime')
//
export interface ZonedDateTime extends DateCalendarFields { calendar: Temporal.CalendarProtocol }
mixinCalendarFields(ZonedDateTime, dateCalendarFields)
//
export interface ZonedDateTime extends LocalTimeFields {}
mixinISOFields(ZonedDateTime, timeUnitNames)
//
export interface ZonedDateTime extends ComputedEpochFields {}
mixinEpochFields(ZonedDateTime)
//
export interface ZonedDateTime extends ToLocaleStringMethods {}
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
  const offsetNano = getSafeOffsetNanosecondsFor(timeZone, instant)
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
