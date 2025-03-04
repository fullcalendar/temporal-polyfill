import { gregoryCalendarId, japaneseCalendarId } from './calendarConfig'
import {
  DateParts,
  EraParts,
  MonthCodeParts,
  NativeCalendar,
  NativeDayOfYearOps,
  WeekParts,
  YearMonthParts,
} from './calendarNative'
import { hashIntlFormatParts } from './intlFormatUtils'
import { parseIntlYear, queryCalendarIntlFormat } from './intlMath'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateFieldNamesAsc,
  isoTimeFieldNamesAsc,
} from './isoFields'
import { Overflow } from './options'
import {
  isoArgsToEpochMilli,
  isoToEpochMilli,
  isoToLegacyDate,
} from './timeMath'
import { allPropsEqual, clampProp, memoize, modFloor, zipProps } from './utils'

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12

export function computeIsoYear(isoFields: IsoDateFields): number {
  return isoFields.isoYear
}

export function computeIsoMonth(isoFields: IsoDateFields): number {
  return isoFields.isoMonth
}

export function computeIsoDay(isoFields: IsoDateFields): number {
  return isoFields.isoDay
}

export function computeIsoDateParts(isoFields: IsoDateFields): DateParts {
  return [isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay]
}

export function computeIsoMonthCodeParts(
  _isoYear: number,
  isoMonth: number,
): MonthCodeParts {
  return [isoMonth, false]
}

export function computeIsoYearMonthForMonthDay(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  _day: number,
): YearMonthParts | undefined {
  if (!isLeapMonth) {
    return [isoEpochFirstLeapYear, monthCodeNumber]
  }
}

export function computeIsoFieldsFromParts(
  year: number,
  month: number,
  day: number,
): IsoDateFields {
  return { isoYear: year, isoMonth: month, isoDay: day }
}

export function computeIsoDaysInWeek(_isoDateFields: IsoDateFields) {
  return 7
}

export function computeIsoMonthsInYear(_isoYear: number): number {
  return isoMonthsInYear
}

export function computeIsoDaysInMonth(
  isoYear: number,
  isoMonth: number,
): number {
  switch (isoMonth) {
    case 2:
      return computeIsoInLeapYear(isoYear) ? 29 : 28
    case 4:
    case 6:
    case 9:
    case 11:
      return 30
  }
  return 31
}

export function computeIsoDaysInYear(isoYear: number): number {
  return computeIsoInLeapYear(isoYear) ? 366 : 365
}

export function computeIsoInLeapYear(isoYear: number): boolean {
  // % is dangerous, but comparing 0 with -0 is fine
  return isoYear % 4 === 0 && (isoYear % 100 !== 0 || isoYear % 400 === 0)
}

export function computeIsoDayOfWeek(isoDateFields: IsoDateFields): number {
  const [legacyDate, daysNudged] = isoToLegacyDate(
    isoDateFields.isoYear,
    isoDateFields.isoMonth,
    isoDateFields.isoDay,
  )

  return modFloor(legacyDate.getUTCDay() - daysNudged, 7) || 7
}

export function computeIsoWeekParts(
  this: NativeCalendar & NativeDayOfYearOps,
  isoDateFields: IsoDateFields,
): WeekParts {
  const startOfWeek = 1
  const minDaysInWeek = this.id ? 1 : 4 // iso=4, gregory/japanese=1

  const isoDayOfWeek = computeIsoDayOfWeek(isoDateFields)
  const isoDayOfYear = this.dayOfYear(isoDateFields)

  // 0-based
  // analyze current date, relative to calendar-decided start-of-week
  const dayOfWeek = modFloor(isoDayOfWeek - startOfWeek, 7)
  const dayOfYear = isoDayOfYear - 1

  // 0-based
  // analyze current year-start
  const y0DayOfWeek = modFloor(dayOfWeek - dayOfYear, 7)
  const y0WeekShift = computeWeekShift(y0DayOfWeek)

  // 1-based
  // tentative result
  let weekOfYear = Math.floor((dayOfYear - y0WeekShift) / 7) + 1
  let yearOfWeek = isoDateFields.isoYear
  let weeksInYear: number

  // Compute the day-of-year (0-based) where first week begins
  // Results can be negative indicating the first week begins in the prev year
  function computeWeekShift(yDayOfWeek: number): number {
    return (7 - yDayOfWeek < minDaysInWeek ? 7 : 0) - yDayOfWeek
  }

  // For a given year relative to `yearOfWeek`, compute the total # of weeks
  function computeWeeksInYear(delta: 0 | -1): number {
    const daysInYear = computeIsoDaysInYear(yearOfWeek + delta)
    const sign = delta || 1
    const y1DayOfWeek = modFloor(y0DayOfWeek + daysInYear * sign, 7)
    const y1WeekShift = computeWeekShift(y1DayOfWeek)
    return (weeksInYear = (daysInYear + (y1WeekShift - y0WeekShift) * sign) / 7)
  }

  if (!weekOfYear) {
    // in previous year's last week
    weekOfYear = computeWeeksInYear(-1)
    yearOfWeek--
  } else if (weekOfYear > computeWeeksInYear(0)) {
    // in next year's first week
    weekOfYear = 1
    yearOfWeek++
  }

  return [weekOfYear, yearOfWeek, weeksInYear!]
}

// Era (complicated stuff)
// -----------------------------------------------------------------------------

const primaryJapaneseEraMilli = isoArgsToEpochMilli(1868, 9, 8)!
const queryJapaneseEraParts = memoize(computeJapaneseEraParts, WeakMap)

export function computeIsoEraParts(
  this: NativeCalendar,
  isoFields: IsoDateFields,
): EraParts {
  if (this.id === gregoryCalendarId) {
    return computeGregoryEraParts(isoFields)
  }

  if (this.id === japaneseCalendarId) {
    return queryJapaneseEraParts(isoFields)
  }

  return [] as unknown as EraParts
}

function computeGregoryEraParts({ isoYear }: IsoDateFields): EraParts {
  if (isoYear < 1) {
    return ['gregory-inverse', -isoYear + 1]
  }
  return ['gregory', isoYear]
}

function computeJapaneseEraParts(isoFields: IsoDateFields): EraParts {
  const epochMilli = isoToEpochMilli(isoFields)!

  if (epochMilli < primaryJapaneseEraMilli) {
    // TODO: DRY with computeGregoryEraParts
    const { isoYear } = isoFields
    if (isoYear < 1) {
      return ['japanese-inverse', -isoYear + 1]
    }
    return ['japanese', isoYear]
  }

  const intlParts = hashIntlFormatParts(
    queryCalendarIntlFormat(japaneseCalendarId),
    epochMilli,
  )

  const { era, eraYear } = parseIntlYear(intlParts, japaneseCalendarId)
  return [era, eraYear]
}

// Checking Fields
// -----------------------------------------------------------------------------
// Checks validity of isoMonth/isoDay, but does NOT do bounds checking

export function checkIsoDateTimeFields<P extends IsoDateTimeFields>(
  isoDateTimeFields: P,
): P {
  checkIsoDateFields(isoDateTimeFields)
  constrainIsoTimeFields(isoDateTimeFields, Overflow.Reject)
  return isoDateTimeFields
}

export function checkIsoDateFields<P extends IsoDateFields>(
  isoInternals: P,
): P {
  constrainIsoDateFields(isoInternals, Overflow.Reject)
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: IsoDateFields): boolean {
  return allPropsEqual(
    isoDateFieldNamesAsc,
    isoFields,
    constrainIsoDateFields(isoFields),
  )
}

// Constraining
// -----------------------------------------------------------------------------

function constrainIsoDateFields(
  isoFields: IsoDateFields,
  overflow?: Overflow,
): IsoDateFields {
  const { isoYear } = isoFields
  const isoMonth = clampProp(
    isoFields,
    'isoMonth',
    1,
    computeIsoMonthsInYear(isoYear),
    overflow,
  )
  const isoDay = clampProp(
    isoFields,
    'isoDay',
    1,
    computeIsoDaysInMonth(isoYear, isoMonth),
    overflow,
  )
  return { isoYear, isoMonth, isoDay }
}

export function constrainIsoTimeFields(
  isoTimeFields: IsoTimeFields,
  overflow?: Overflow,
): IsoTimeFields {
  return zipProps(isoTimeFieldNamesAsc, [
    clampProp(isoTimeFields, 'isoHour', 0, 23, overflow),
    clampProp(isoTimeFields, 'isoMinute', 0, 59, overflow),
    clampProp(isoTimeFields, 'isoSecond', 0, 59, overflow),
    clampProp(isoTimeFields, 'isoMillisecond', 0, 999, overflow),
    clampProp(isoTimeFields, 'isoMicrosecond', 0, 999, overflow),
    clampProp(isoTimeFields, 'isoNanosecond', 0, 999, overflow),
  ])
}
