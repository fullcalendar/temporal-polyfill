import { Temporal } from 'temporal-spec'
import { getCommonCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { toString } from '../argParse/fieldStr'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { ensureOptionsObject, isObjectLike } from '../argParse/refine'
import {
  IsoMasterMethods,
  ensureObj,
  initIsoMaster,
  mixinIsoMasterMethods,
  needReceiver,
} from '../dateUtils/abstract'
import { compareDateTimes } from '../dateUtils/compare'
import { constrainDateISO, constrainTimeISO } from '../dateUtils/constrain'
import { zeroISOTimeFields } from '../dateUtils/dayAndTime'
import { diffDates } from '../dateUtils/diff'
import { processDateFromFields, processDateWithFields } from '../dateUtils/fromAndWith'
import { validateDate } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateISO } from '../dateUtils/isoFormat'
import {
  DateCalendarFields,
  attachStringTag,
  dateCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { parseDateTime } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { DAY, DateUnitInt, YEAR } from '../dateUtils/units'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { calendarFrom, createDefaultCalendar } from './calendar'
import { Duration, DurationArg, createDuration } from './duration'
import { PlainDateTime, createDateTime } from './plainDateTime'
import { PlainTime, PlainTimeArg, ensureLooseTime } from './plainTime'
import { createYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { ZonedDateTime, createZonedDateTimeFromFields } from './zonedDateTime'

export type PlainDateArg = Temporal.PlainDate | Temporal.PlainDateLike | string

// inlined in the spec. not easy to get out
type ToZonedDateTimeOptions = Temporal.TimeZoneProtocol | string | {
  timeZone: Temporal.TimeZoneLike
  plainTime?: Temporal.PlainTime | Temporal.PlainTimeLike | string
}

type DiffOptions = Temporal.DifferenceOptions<'year' | 'month' | 'week' | 'day'>

export class PlainDate implements Temporal.PlainDate {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
  ) {
    const constrained = constrainDateISO({ isoYear, isoMonth, isoDay }, OVERFLOW_REJECT)
    const calendar = calendarFrom(calendarArg)

    validateDate(constrained)
    initIsoMaster(this, {
      // order matters for getISOFIelds
      calendar,
      ...constrained,
    })
  }

  static from(arg: PlainDateArg, options?: Temporal.AssignmentOptions): Temporal.PlainDate {
    if (
      arg instanceof PlainDate ||
      arg instanceof PlainDateTime ||
      arg instanceof ZonedDateTime
    ) {
      parseOverflowOption(options) // unused, but must validate
      return createDate(arg.getISOFields()) // optimization
    }
    if (isObjectLike(arg)) {
      return processDateFromFields(arg, options) // will parse options
    }

    parseOverflowOption(options) // unused, but must validate

    // parse as string...
    const parsed = parseDateTime(toString(arg))

    // reject out-of-bound time values if included in the string
    // the date values will be checked in constructor
    constrainTimeISO(parsed, OVERFLOW_REJECT)

    return createDate(refineBaseObj(parsed))
  }

  static compare(a: PlainDateArg, b: PlainDateArg): Temporal.ComparisonResult {
    return compareDateTimes(
      ensureObj(PlainDate, a),
      ensureObj(PlainDate, b),
    )
  }

  with(fields: Temporal.PlainDateLike, options?: Temporal.AssignmentOptions): Temporal.PlainDate {
    needReceiver(PlainDate, this)
    return processDateWithFields(this, fields, options)
  }

  withCalendar(calendarArg: Temporal.CalendarLike): Temporal.PlainDate {
    needReceiver(PlainDate, this)
    const isoFields = this.getISOFields()
    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      calendarArg,
    )
  }

  add(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.PlainDate {
    needReceiver(PlainDate, this)
    const duration = ensureObj(Duration, durationArg)
    const plainDate = this.calendar.dateAdd(this, duration, ensureOptionsObject(options))
    if (!(plainDate instanceof PlainDate)) {
      throw new TypeError('Invalid return type')
    }
    return plainDate
  }

  subtract(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.PlainDate {
    needReceiver(PlainDate, this)
    const duration = ensureObj(Duration, durationArg).negated()
    const plainDate = this.calendar.dateAdd(this, duration, ensureOptionsObject(options))
    if (!(plainDate instanceof PlainDate)) {
      throw new TypeError('Invalid return type')
    }
    return plainDate
  }

  until(other: PlainDateArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(PlainDate, this)
    return diffPlainDates(
      this,
      ensureObj(PlainDate, other),
      false,
      options,
    )
  }

  since(other: PlainDateArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(PlainDate, this)
    return diffPlainDates(
      this,
      ensureObj(PlainDate, other),
      true,
      options,
    )
  }

  equals(other: PlainDateArg): boolean {
    needReceiver(PlainDate, this)
    const otherPlainDate = ensureObj(PlainDate, other)
    return !compareDateTimes(this, otherPlainDate) &&
      this.calendar.toString() === otherPlainDate.calendar.toString()
  }

  toString(options?: Temporal.ShowCalendarOption): string {
    needReceiver(PlainDate, this)

    const calendarDisplay = parseCalendarDisplayOption(options)
    const fields = this.getISOFields()

    return formatDateISO(fields) +
      formatCalendarID(fields.calendar.toString(), calendarDisplay)
  }

  toZonedDateTime(options: ToZonedDateTimeOptions): Temporal.ZonedDateTime {
    needReceiver(PlainDate, this)

    const refinedOptions = processToZonedDateTimeOptions(options)
    const timeZone = ensureObj(TimeZone, refinedOptions.timeZone)
    const plainTime = refinedOptions.plainTime === undefined
      ? undefined
      : ensureObj(PlainTime, refinedOptions.plainTime)

    return createZonedDateTimeFromFields({
      ...this.getISOFields(),
      ...(plainTime ? plainTime.getISOFields() : zeroISOTimeFields),
      timeZone,
    })
  }

  toPlainDateTime(timeArg?: PlainTimeArg): Temporal.PlainDateTime {
    needReceiver(PlainDate, this)
    return createDateTime({
      ...this.getISOFields(),
      ...ensureLooseTime(timeArg).getISOFields(),
    })
  }

  toPlainYearMonth(): Temporal.PlainYearMonth {
    needReceiver(PlainDate, this)
    return createYearMonth(this.getISOFields())
  }

  toPlainMonthDay(): Temporal.PlainMonthDay {
    needReceiver(PlainDate, this)
    return this.calendar.monthDayFromFields(this)
  }
}

// mixins
export interface PlainDate extends IsoMasterMethods<Temporal.PlainDateISOFields> {}
mixinIsoMasterMethods(PlainDate)
//
export interface PlainDate { [Symbol.toStringTag]: 'Temporal.PlainDate' }
attachStringTag(PlainDate, 'PlainDate')
//
export interface PlainDate extends DateCalendarFields { calendar: Temporal.CalendarProtocol }
mixinCalendarFields(PlainDate, dateCalendarFields)
mixinISOFields(PlainDate)
//
export interface PlainDate extends ToLocaleStringMethods {}
mixinLocaleStringMethods(PlainDate, createPlainFormatFactoryFactory({
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: undefined,
}, {
  hour: undefined,
  minute: undefined,
  second: undefined,
}))

// creation
export function createDate(isoFields: Temporal.PlainDateISOFields): PlainDate {
  return new PlainDate(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.calendar,
  )
}

// argument processing
function processToZonedDateTimeOptions(
  options?: ToZonedDateTimeOptions,
): {
    plainTime?: PlainTimeArg,
    timeZone: Temporal.TimeZoneLike,
  } {
  let plainTime: PlainTimeArg | undefined
  let timeZone: Temporal.TimeZoneLike | undefined

  if (typeof options === 'string') {
    timeZone = options
  } else if (typeof options === 'object') {
    if ((options as Temporal.TimeZoneProtocol).id !== undefined) {
      timeZone = options as Temporal.TimeZoneProtocol
    } else {
      timeZone = options.timeZone
      plainTime = (options as { plainTime?: PlainTimeArg }).plainTime
    }
    if (timeZone === undefined) {
      throw new TypeError('Invalid timeZone argument')
    }
  } else {
    throw new TypeError('Invalid options/timeZone argument')
  }

  return { plainTime, timeZone }
}

function diffPlainDates(
  pd0: PlainDate,
  pd1: PlainDate,
  flip: boolean,
  options: DiffOptions | undefined,
): Duration {
  return createDuration(
    diffDates(
      pd0,
      pd1,
      getCommonCalendar(pd0, pd1),
      flip,
      parseDiffOptions<Temporal.DateUnit, DateUnitInt>(options, DAY, DAY, DAY, YEAR),
    ),
  )
}
