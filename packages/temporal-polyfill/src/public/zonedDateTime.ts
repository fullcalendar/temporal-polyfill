import { getStrangerCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDisambigOption } from '../argParse/disambig'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OFFSET_DISPLAY_AUTO, parseOffsetDisplayOption } from '../argParse/offsetDisplay'
import { OFFSET_PREFER, OFFSET_REJECT, parseOffsetHandlingOption } from '../argParse/offsetHandling'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { parseTimeZoneDisplayOption } from '../argParse/timeZoneDisplay'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { createDate } from '../dateUtils/date'
import { createDateTime } from '../dateUtils/dateTime'
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
import { epochNanoToISOFields } from '../dateUtils/isoMath'
import {
  ComputedEpochFields,
  DateCalendarFields,
  dateCalendarFields,
  mixinCalendarFields,
  mixinEpochFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { parseZonedDateTime } from '../dateUtils/parse'
import { refineZonedObj } from '../dateUtils/parseRefine'
import { TimeFields, createTime, zeroTimeISOFields } from '../dateUtils/time'
import { nanoInHour } from '../dateUtils/units'
import { createYearMonth } from '../dateUtils/yearMonth'
import {
  addToZonedDateTime,
  computeNanoInDay,
  createZonedDateTime,
  diffZonedDateTimes,
  roundZonedDateTime,
  roundZonedDateTimeWithOptions,
} from '../dateUtils/zonedDateTime'
import { createZonedFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { compareValues, roundToMinute } from '../utils/math'
import { createWeakMap } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration } from './duration'
import { Instant } from './instant'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import {
  CalendarArg,
  CompareResult,
  DateArg,
  DateTimeRoundingOptions,
  DiffOptions,
  DurationArg,
  OverflowOptions,
  TimeArg,
  TimeZoneArg,
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
    const instant = new Instant(epochNanoseconds) // will do validation
    const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(instant)
    const isoFields = epochNanoToISOFields(epochNanoseconds + BigInt(offsetNanoseconds))

    validateDateTime(isoFields, calendar.id)

    super({
      ...isoFields,
      calendar,
      timeZone,
      // NOTE: must support TimeZone protocols that don't implement getOffsetStringFor
      // TODO: more DRY with getOffsetStringFor
      offset: formatOffsetISO(timeZone.getOffsetNanosecondsFor(instant)),
    })

    setPrivateFields(this, {
      epochNanoseconds,
      offsetNanoseconds,
    })
  }

  static from(arg: ZonedDateTimeArg, options?: ZonedDateTimeOptions): ZonedDateTime {
    const offsetHandling = parseOffsetHandlingOption(options, OFFSET_REJECT)
    const overflowHandling = parseOverflowOption(options)
    const isObject = typeof arg === 'object'

    return createZonedDateTime(
      arg instanceof ZonedDateTime
        ? { // optimization
            ...arg.getISOFields(),
            offset: arg.offsetNanoseconds,
          }
        : isObject
          ? processZonedDateTimeFromFields(arg, overflowHandling, options)
          : refineZonedObj(parseZonedDateTime(String(arg))),
      options,
      offsetHandling,
      !isObject, // fromString
    )
  }

  static compare(a: ZonedDateTimeArg, b: ZonedDateTimeArg): CompareResult {
    return compareValues(
      ensureObj(ZonedDateTime, a).epochNanoseconds,
      ensureObj(ZonedDateTime, b).epochNanoseconds,
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

    return createZonedDateTime(
      processZonedDateTimeWithFields(this, fields, overflowHandling, options),
      options,
      offsetHandling,
    )
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
    return this.toPlainDate().toZonedDateTime({
      plainTime: timeArg,
      timeZone: this.timeZone,
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
    return addToZonedDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return addToZonedDateTime(this, ensureObj(Duration, durationArg).negated(), options)
  }

  until(other: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), options)
  }

  since(other: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return diffZonedDateTimes(this, ensureObj(ZonedDateTime, other), options, true)
  }

  round(options?: DateTimeRoundingOptions): ZonedDateTime {
    return roundZonedDateTimeWithOptions(this, options)
  }

  equals(other: ZonedDateTimeArg): boolean {
    const otherZdt = ensureObj(ZonedDateTime, other)

    return this.epochNanoseconds === otherZdt.epochNanoseconds &&
      this.calendar.id === otherZdt.calendar.id &&
      this.timeZone.id === otherZdt.timeZone.id
  }

  startOfDay(): ZonedDateTime {
    return createZonedDateTime( // TODO: more DRY with computeNanoInDay
      {
        ...this.getISOFields(),
        ...zeroTimeISOFields,
        offset: undefined,
      },
      undefined, // options
      OFFSET_REJECT, // doesn't matter b/c no explicit offset given
    )
  }

  // TODO: turn into a lazy-getter, like what mixinCalendarFields does
  get hoursInDay(): number {
    return computeNanoInDay(this) / nanoInHour
  }

  toString(options?: ZonedDateTimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const offsetDisplay = parseOffsetDisplayOption(options)
    const timeZoneDisplay = parseTimeZoneDisplayOption(options)
    const calendarDisplay = parseCalendarDisplayOption(options)
    const roundedZdt = roundZonedDateTime(
      this,
      formatConfig.roundingIncrement,
      formatConfig.roundingMode,
    )
    const roundedISOFields = roundedZdt.getISOFields()

    return formatDateTimeISO(roundedISOFields, formatConfig) +
      (offsetDisplay === OFFSET_DISPLAY_AUTO
        ? formatOffsetISO(roundToMinute(roundedZdt.offsetNanoseconds))
        : ''
      ) +
      formatTimeZoneID(roundedISOFields.timeZone.toString(), timeZoneDisplay) +
      formatCalendarID(roundedISOFields.calendar.toString(), calendarDisplay)
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
export interface ZonedDateTime extends TimeFields {}
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
