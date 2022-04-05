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
import { zeroISOTimeFields } from '../dateUtils/dayAndTime'
import { diffDateTimes } from '../dateUtils/diff'
import { negateDuration } from '../dateUtils/durationFields'
import { epochNanoToISOFields } from '../dateUtils/epoch'
import {
  processZonedDateTimeFromFields,
  processZonedDateTimeWithFields,
} from '../dateUtils/fromAndWith'
import { validateDateTime } from '../dateUtils/isoFieldValidation'
import {
  formatCalendarID,
  formatDateTimeISO,
  formatOffsetISO,
  formatTimeZoneID,
} from '../dateUtils/isoFormat'
import {
  ComputedEpochFields,
  DateCalendarFields,
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
import { translateZonedDateTimeFields } from '../dateUtils/translate'
import { DurationFields, ISODateTimeFields, LocalTimeFields } from '../dateUtils/typesPrivate'
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
import { roundToMinute } from '../utils/math'
import { createWeakMap } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, createDuration } from './duration'
import { Instant } from './instant'
import { PlainDate, createDate } from './plainDate'
import { PlainDateTime, createDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime, createTime } from './plainTime'
import { PlainYearMonth, createYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import {
  CalendarArg,
  CompareResult,
  DateArg,
  DateTimeRoundingOptions,
  DayTimeUnit,
  DiffOptions,
  DurationArg,
  OverflowOptions,
  TimeArg,
  TimeZoneArg,
  Unit,
  ZonedDateTimeArg,
  ZonedDateTimeISOFields,
  ZonedDateTimeOptions,
  ZonedDateTimeOverrides,
  ZonedDateTimeToStringOptions,
} from './types'

interface ZonedDateTimePrivateFields {
  offsetNanoseconds: number
  epochNanoseconds: bigint
}

const [getPrivateFields, setPrivateFields] =
  createWeakMap<ZonedDateTime, ZonedDateTimePrivateFields>()

export class ZonedDateTime extends AbstractISOObj<ZonedDateTimeISOFields> {
  constructor(
    epochNanoseconds: bigint,
    timeZoneArg: TimeZoneArg,
    calendarArg: CalendarArg = createDefaultCalendar(),
  ) {
    const timeZone = ensureObj(TimeZone, timeZoneArg)
    const calendar = ensureObj(Calendar, calendarArg)

    const [isoFields, offsetNano] = buildZonedDateTimeISOFields(epochNanoseconds, timeZone)
    validateDateTime(isoFields, calendar.id)

    super({
      ...isoFields,
      calendar,
      timeZone,
      // NOTE: must support TimeZone protocols that don't implement getOffsetStringFor
      // TODO: more DRY with getOffsetStringFor
      offset: formatOffsetISO(offsetNano),
    })

    setPrivateFields(this, {
      epochNanoseconds,
      offsetNanoseconds: offsetNano,
    })
  }

  static from(arg: ZonedDateTimeArg, options?: ZonedDateTimeOptions): ZonedDateTime {
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
      !isObject, // fuzzyMatching
      offsetHandling,
      options,
    )
  }

  static compare(a: ZonedDateTimeArg, b: ZonedDateTimeArg): CompareResult {
    return compareEpochObjs(
      ensureObj(ZonedDateTime, a),
      ensureObj(ZonedDateTime, b),
    )
  }

  get timeZone(): TimeZone { return this.getISOFields().timeZone }
  get epochNanoseconds(): bigint { return getPrivateFields(this).epochNanoseconds }
  get offsetNanoseconds(): number { return getPrivateFields(this).offsetNanoseconds }
  get offset(): string { return this.getISOFields().offset }

  with(fields: ZonedDateTimeOverrides, options?: ZonedDateTimeOptions): ZonedDateTime {
    parseDisambigOption(options) // for validation
    const overflowHandling = parseOverflowOption(options) // for validation (?)
    const offsetHandling = parseOffsetHandlingOption(options, OFFSET_PREFER)
    const refined = processZonedDateTimeWithFields(this, fields, overflowHandling, options)

    return createZonedDateTimeFromFields(refined, false, offsetHandling, options)
  }

  withPlainDate(dateArg: DateArg): ZonedDateTime {
    const date = ensureObj(PlainDate, dateArg)
    const dateTime = date.toPlainDateTime(this) // timeArg=this
    const { timeZone } = this
    const instant = timeZone.getInstantFor(dateTime)

    return new ZonedDateTime(
      instant.epochNanoseconds,
      timeZone,
      getStrangerCalendar(this, date),
    )
  }

  withPlainTime(timeArg?: TimeArg): ZonedDateTime {
    const plainTime = ensureObj(PlainTime, timeArg)

    return createZonedDateTimeFromFields({
      ...this.getISOFields(),
      ...plainTime.getISOFields(),
    })
  }

  withCalendar(calendarArg: CalendarArg): ZonedDateTime {
    return new ZonedDateTime(
      this.epochNanoseconds,
      this.timeZone,
      calendarArg,
    )
  }

  withTimeZone(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return new ZonedDateTime(
      this.epochNanoseconds,
      timeZoneArg,
      this.calendar,
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return translateZonedDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return translateZonedDateTime(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), false, options)
  }

  since(other: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), true, options)
  }

  round(options?: DateTimeRoundingOptions | DayTimeUnit): ZonedDateTime {
    const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
      options,
      undefined, // no default. will error-out if unset
      NANOSECOND, // minUnit
      DAY, // maxUnit
    )

    return roundZonedDateTime(this, roundingConfig)
  }

  equals(other: ZonedDateTimeArg): boolean {
    return zonedDateTimesEqual(this, ensureObj(ZonedDateTime, other))
  }

  startOfDay(): ZonedDateTime {
    return createZonedDateTimeFromFields({
      ...this.getISOFields(),
      ...zeroISOTimeFields,
      offsetNanoseconds: this.offsetNanoseconds,
    })
  }

  // TODO: turn into a lazy-getter, like what mixinCalendarFields does
  get hoursInDay(): number {
    return computeNanoInDay(this.getISOFields()) / nanoInHour
  }

  toString(options?: ZonedDateTimeToStringOptions): string {
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

  toPlainYearMonth(): PlainYearMonth { return createYearMonth(this.getISOFields()) }
  toPlainMonthDay(): PlainMonthDay { return this.calendar.monthDayFromFields(this) }
  toPlainDateTime(): PlainDateTime { return createDateTime(this.getISOFields()) }
  toPlainDate(): PlainDate { return createDate(this.getISOFields()) }
  toPlainTime(): PlainTime { return createTime(this.getISOFields()) }
  toInstant(): Instant { return new Instant(this.epochNanoseconds) }
}

// mixins
export interface ZonedDateTime extends DateCalendarFields { calendar: Calendar }
export interface ZonedDateTime extends LocalTimeFields {}
export interface ZonedDateTime extends ComputedEpochFields {}
export interface ZonedDateTime extends ToLocaleStringMethods {}
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
  disambigOptions?: ZonedDateTimeOptions, // TODO: more specific type
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
  epochNano: bigint,
  timeZone: TimeZone,
): [ISODateTimeFields, number] {
  const instant = new Instant(epochNano) // will do validation
  const offsetNano = timeZone.getOffsetNanosecondsFor(instant)
  const isoFields = epochNanoToISOFields(epochNano + BigInt(offsetNano))
  return [isoFields, offsetNano]
}

function translateZonedDateTime(
  zdt: ZonedDateTime,
  dur: DurationFields,
  options: OverflowOptions | undefined,
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
  const epochNano = roundZonedDateTimeFields(isoFields, roundingConfig)
  return new ZonedDateTime(epochNano, isoFields.timeZone, isoFields.calendar)
}

// TODO: make common util with PlainDateTime, because leverages same diffDateTimes?
function diffZonedDateTimes(
  dt0: ZonedDateTime,
  dt1: ZonedDateTime,
  flip: boolean,
  options: DiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
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
