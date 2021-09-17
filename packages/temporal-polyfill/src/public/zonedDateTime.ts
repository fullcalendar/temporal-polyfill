import { extractCalendar, isoCalendar } from '../argParse/calendar'
import { parseCalendarDisplay } from '../argParse/calendarDisplay'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OFFSET_DISPLAY_AUTO, parseOffsetDisplay } from '../argParse/offsetDisplay'
import { OFFSET_PREFER, OFFSET_REJECT } from '../argParse/offsetHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { extractTimeZone } from '../argParse/timeZone'
import { parseTimeZoneDisplay } from '../argParse/timeZoneDisplay'
import { timeUnitNames } from '../argParse/units'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { createDate } from '../dateUtils/date'
import { createDateTime } from '../dateUtils/dateTime'
import { formatCalendarID, formatDateTimeISO, formatTimeZoneID } from '../dateUtils/isoFormat'
import { epochNanoToISOFields } from '../dateUtils/isoMath'
import {
  ComputedEpochFields,
  DateCalendarFields,
  dateCalendarFields,
  mixinCalendarFields,
  mixinEpochFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { createMonthDay } from '../dateUtils/monthDay'
import { parseDateTimeISO } from '../dateUtils/parse'
import { TimeFields, createTime } from '../dateUtils/time'
import { milliInDay } from '../dateUtils/units'
import { createYearMonth } from '../dateUtils/yearMonth'
import {
  ZonedDateTimeISOEssentials,
  addToZonedDateTime,
  compareZonedDateTimes,
  createZonedDateTime,
  diffZonedDateTimes,
  overrideZonedDateTimeFields,
  roundZonedDateTime,
  zonedDateTimeFieldMap,
  zonedDateTimeFieldsToISO,
} from '../dateUtils/zonedDateTime'
import { createWeakMap } from '../utils/obj'
import {
  CalendarArg,
  CompareResult,
  DateArg,
  DateTimeRoundOptions,
  DiffOptions,
  DurationArg,
  LocalesArg,
  OverflowOptions,
  TimeArg,
  TimeZoneArg,
  ZonedDateTimeArg,
  ZonedDateTimeISOFields,
  ZonedDateTimeLikeFields,
  ZonedDateTimeOptions,
  ZonedDateTimeOverrides,
  ZonedDateTimeToStringOptions,
} from './args'
import { Calendar } from './calendar'
import { Duration } from './duration'
import { Instant } from './instant'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'

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
    calendarArg: CalendarArg = isoCalendar,
  ) {
    const timeZone = ensureObj(TimeZone, timeZoneArg)
    const calendar = ensureObj(Calendar, calendarArg)
    const instant = new Instant(epochNanoseconds)
    const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(instant)

    super({
      ...epochNanoToISOFields(epochNanoseconds - BigInt(offsetNanoseconds)),
      calendar,
      timeZone,
      offset: timeZone.getOffsetStringFor(instant),
    })

    setPrivateFields(this, {
      epochNanoseconds,
      offsetNanoseconds,
    })
  }

  static from(arg: ZonedDateTimeArg, options?: ZonedDateTimeOptions): ZonedDateTime {
    return createZonedDateTime(
      arg instanceof ZonedDateTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? zonedDateTimeFieldsToISO(
            refineFields(arg, zonedDateTimeFieldMap) as ZonedDateTimeLikeFields,
            options,
            extractCalendar(arg),
            extractTimeZone(arg),
          )
          // if parsing doesn't return a timeZone, createZonedDateTime will throw error
          : parseDateTimeISO(String(arg)) as ZonedDateTimeISOEssentials,
      options,
      OFFSET_REJECT,
    )
  }

  static compare(a: ZonedDateTimeArg, b: ZonedDateTimeArg): CompareResult {
    return compareZonedDateTimes(
      ensureObj(ZonedDateTime, a),
      ensureObj(ZonedDateTime, b),
    )
  }

  get timeZone(): TimeZone { return this.getISOFields().timeZone }
  get epochNanoseconds(): bigint { return getPrivateFields(this).epochNanoseconds }
  get offsetNanoseconds(): number { return getPrivateFields(this).offsetNanoseconds }
  get offset(): string { return this.getISOFields().offset }

  with(fields: ZonedDateTimeOverrides, options?: ZonedDateTimeOptions): ZonedDateTime {
    const refinedFields = refineOverrideFields(fields, zonedDateTimeFieldMap)
    const mergedFields = overrideZonedDateTimeFields(refinedFields, this)
    return createZonedDateTime(
      zonedDateTimeFieldsToISO(
        mergedFields,
        options,
        this.calendar,
        this.timeZone,
      ),
      options,
      OFFSET_PREFER,
    )
  }

  withPlainDate(dateArg: DateArg): ZonedDateTime {
    return ensureObj(PlainDate, dateArg).toZonedDateTime({
      plainTime: this.toPlainTime(),
      timeZone: this.timeZone,
    })
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
    return diffZonedDateTimes(ensureObj(ZonedDateTime, other), this, options)
  }

  round(options?: DateTimeRoundOptions): ZonedDateTime {
    return roundZonedDateTime(this, options)
  }

  equals(other: ZonedDateTimeArg): boolean {
    return compareZonedDateTimes(this, ensureObj(ZonedDateTime, other)) === 0
  }

  startOfDay(): ZonedDateTime {
    const dateTime = this.toPlainDateTime()
    const instant = this.timeZone.getInstantFor(dateTime, { disambiguation: 'earlier' })
    return new ZonedDateTime(instant.epochNanoseconds, this.timeZone, this.calendar)
  }

  // TODO: turn into a lazy-getter, like what mixinCalendarFields does
  get hoursInDay(): number {
    const dateTime0 = this.toPlainDateTime()
    const dateTime1 = dateTime0.add({ days: 1 })
    const instant0 = this.timeZone.getInstantFor(dateTime0, { disambiguation: 'earlier' })
    const instant1 = this.timeZone.getInstantFor(dateTime1, { disambiguation: 'earlier' })
    return Math.floor((instant1.epochMilliseconds - instant0.epochMilliseconds) / milliInDay)
  }

  toString(options?: ZonedDateTimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const offsetDisplay = parseOffsetDisplay(options?.offset)
    const timeZoneDisplay = parseTimeZoneDisplay(options?.timeZoneName)
    const calendarDisplay = parseCalendarDisplay(options?.calendarName)
    const fields = this.getISOFields()

    return formatDateTimeISO(fields, formatConfig) +
      (offsetDisplay === OFFSET_DISPLAY_AUTO ? fields.offset : '') + // already formatted
      formatTimeZoneID(fields.timeZone.id, timeZoneDisplay) +
      formatCalendarID(fields.calendar.id, calendarDisplay)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const fields = this.getISOFields()

    return new Intl.DateTimeFormat(locales, {
      calendar: fields.calendar.id,
      timeZone: fields.timeZone.id,
      ...options,
      // TODO: inject more options to ensure time is displayed by default
    }).format(
      this.epochMilliseconds,
    )
  }

  toPlainYearMonth(): PlainYearMonth { return createYearMonth(this.getISOFields()) }
  toPlainMonthDay(): PlainMonthDay { return createMonthDay(this.getISOFields()) }
  toPlainDateTime(): PlainDateTime { return createDateTime(this.getISOFields()) }
  toPlainDate(): PlainDate { return createDate(this.getISOFields()) }
  toPlainTime(): PlainTime { return createTime(this.getISOFields()) }
  toInstant(): Instant { return new Instant(this.epochNanoseconds) }
}

// mixins
export interface ZonedDateTime extends DateCalendarFields { calendar: Calendar }
export interface ZonedDateTime extends TimeFields {}
export interface ZonedDateTime extends ComputedEpochFields {}
mixinISOFields(ZonedDateTime, timeUnitNames)
mixinCalendarFields(ZonedDateTime, dateCalendarFields)
mixinEpochFields(ZonedDateTime)
