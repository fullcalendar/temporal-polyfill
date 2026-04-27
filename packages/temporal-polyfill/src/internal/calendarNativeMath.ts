import {
  gregoryCalendarId,
  isoCalendarId,
  japaneseCalendarId,
} from './calendarConfig'
import {
  YearMonthParts,
  monthCodeNumberToMonth,
} from './calendarNative'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
} from './durationFields'
import * as errorMessages from './errorMessages'
import {
  IntlCalendar,
  computeIntlDateParts,
  computeIntlDaysInMonth,
  computeIntlEpochMilli,
  computeIntlLeapMonth,
  computeIntlMonthCodeParts,
  computeIntlMonthsInYear,
  queryIntlCalendar,
} from './intlMath'
import { IsoDateFields, isoTimeFieldDefaults } from './isoFields'
import {
  computeIsoDateParts,
  computeIsoDaysInMonth,
  computeIsoMonthCodeParts,
  computeIsoMonthsInYear,
  isoMonthsInYear,
} from './isoMath'
import { Overflow } from './options'
import {
  DiffOptions,
  OverflowOptions,
  refineOverflowOptions,
} from './optionsRefine'
import {
  checkIsoDateInBounds,
  epochMilliToIso,
  isoArgsToEpochMilli,
  isoToEpochMilli,
} from './timeMath'
import { DateUnitName, Unit, givenFieldsToBigNano, milliInDay } from './units'
import { clampEntity, divModTrunc, divTrunc, modTrunc } from './utils'

export function dateAdd(
  calendarId: string,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): IsoDateFields {
  const overflow = refineOverflowOptions(options)
  const intlCalendar = queryIntlCalendarMaybe(calendarId)
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  days += givenFieldsToBigNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  if (years || months) {
    epochMilli = monthAdd(
      calendarId,
      isoDateFields,
      years,
      months,
      overflow,
      intlCalendar,
    )
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  if (epochMilli === undefined) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  epochMilli += (weeks * 7 + days) * milliInDay

  return checkIsoDateInBounds(epochMilliToIso(epochMilli))
}

export function monthAdd(
  calendarId: string,
  isoDateFields: IsoDateFields,
  years: number,
  months: number,
  overflow: Overflow,
  intlCalendar = queryIntlCalendarMaybe(calendarId),
): number {
  let [year, month, day] = intlCalendar
    ? computeIntlDateParts(intlCalendar, isoDateFields)
    : computeIsoDateParts(isoDateFields)

  if (years) {
    const [monthCodeNumber, isLeapMonth] = intlCalendar
      ? computeIntlMonthCodeParts(intlCalendar, year, month)
      : computeIsoMonthCodeParts(year, month)
    year += years
    month = monthCodeNumberToMonth(
      monthCodeNumber,
      isLeapMonth,
      intlCalendar ? computeIntlLeapMonth(intlCalendar, year) : undefined,
    )
    month = clampEntity(
      'month',
      month,
      1,
      intlCalendar ? computeIntlMonthsInYear(intlCalendar, year) : computeIsoMonthsInYear(year),
      overflow,
    )
  }

  if (months) {
    ;[year, month] = intlCalendar
      ? intlMonthAdd(intlCalendar, year, month, months)
      : isoMonthAdd(year, month, months)
  }

  day = clampEntity(
    'day',
    day,
    1,
    intlCalendar
      ? computeIntlDaysInMonth(intlCalendar, year, month)
      : computeIsoDaysInMonth(year, month),
    overflow,
  )

  return intlCalendar
    ? computeIntlEpochMilli(intlCalendar, year, month, day)
    : isoArgsToEpochMilli(year, month, day)!
}

export function isoMonthAdd(
  year: number,
  month: number,
  monthDelta: number,
): YearMonthParts {
  year += divTrunc(monthDelta, isoMonthsInYear)
  month += modTrunc(monthDelta, isoMonthsInYear)

  if (month < 1) {
    year--
    month += isoMonthsInYear
  } else if (month > isoMonthsInYear) {
    year++
    month -= isoMonthsInYear
  }

  return [year, month]
}

export function intlMonthAdd(
  intlCalendar: IntlCalendar,
  year: number,
  month: number,
  monthDelta: number,
): YearMonthParts {
  if (monthDelta) {
    month += monthDelta

    if (!Number.isSafeInteger(month)) {
      throw new RangeError(errorMessages.outOfBoundsDate)
    }

    if (monthDelta < 0) {
      while (month < 1) {
        month += computeIntlMonthsInYear(intlCalendar, --year)
      }
    } else {
      let monthsInYear: number
      while (month > (monthsInYear = computeIntlMonthsInYear(intlCalendar, year))) {
        month -= monthsInYear
        year++
      }
    }
  }

  return [year, month]
}

export function diffEpochMilliByDay(
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.trunc((epochMilli1 - epochMilli0) / milliInDay)
}

export function nativeDateUntil(
  calendarId: string,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit,
): DurationFields {
  const intlCalendar = queryIntlCalendarMaybe(calendarId)

  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(
      { ...startIsoFields, ...isoTimeFieldDefaults },
      { ...endIsoFields, ...isoTimeFieldDefaults },
    )

    if (largestUnit === Unit.Week) {
      ;[weeks, days] = divModTrunc(days, 7)
    }

    return { ...durationFieldDefaults, weeks, days }
  }

  const yearMonthDayStart = intlCalendar
    ? computeIntlDateParts(intlCalendar, startIsoFields)
    : computeIsoDateParts(startIsoFields)
  const yearMonthDayEnd = intlCalendar
    ? computeIntlDateParts(intlCalendar, endIsoFields)
    : computeIsoDateParts(endIsoFields)
  let [years, months, days] = diffYearMonthDay(
    intlCalendar,
    ...yearMonthDayStart,
    ...yearMonthDayEnd,
  )

  if (largestUnit === Unit.Month) {
    months += intlCalendar
      ? computeIntlMonthsInYearSpan(intlCalendar, years, yearMonthDayStart[0])
      : computeIsoMonthsInYearSpan(years)
    years = 0
  }

  return { ...durationFieldDefaults, years, months, days }
}

export function computeIsoMonthsInYearSpan(yearDelta: number): number {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(
  intlCalendar: IntlCalendar,
  yearDelta: number,
  yearStart: number,
): number {
  const yearEnd = yearStart + yearDelta
  const yearSign = Math.sign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = yearStart; year !== yearEnd; year += yearSign) {
    months += computeIntlMonthsInYear(intlCalendar, year + yearCorrection)
  }

  return months
}

function diffDays(
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(startIsoFields)!,
    isoToEpochMilli(endIsoFields)!,
  )
}

function diffYearMonthDay(
  intlCalendar: IntlCalendar | undefined,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): [yearDiff: number, monthDiff: number, dayDiff: number] {
  let yearDiff = year1 - year0
  let monthDiff = month1 - month0
  let dayDiff = day1 - day0

  if (yearDiff || monthDiff) {
    const sign = Math.sign(yearDiff || monthDiff)
    let daysInMonth1 = intlCalendar
      ? computeIntlDaysInMonth(intlCalendar, year1, month1)
      : computeIsoDaysInMonth(year1, month1)
    let dayCorrect = 0

    if (Math.sign(dayDiff) === -sign) {
      const origDaysInMonth1 = daysInMonth1

      ;[year1, month1] = intlCalendar
        ? intlMonthAdd(intlCalendar, year1, month1, -sign)
        : isoMonthAdd(year1, month1, -sign)
      yearDiff = year1 - year0
      monthDiff = month1 - month0
      daysInMonth1 = intlCalendar
        ? computeIntlDaysInMonth(intlCalendar, year1, month1)
        : computeIsoDaysInMonth(year1, month1)

      dayCorrect = sign < 0 ? -origDaysInMonth1 : daysInMonth1
    }

    const day0Trunc = Math.min(day0, daysInMonth1)
    dayDiff = day1 - day0Trunc + dayCorrect

    if (yearDiff) {
      const [monthCodeNumber0, isLeapYear0] = intlCalendar
        ? computeIntlMonthCodeParts(intlCalendar, year0, month0)
        : computeIsoMonthCodeParts(year0, month0)
      const [monthCodeNumber1, isLeapYear1] = intlCalendar
        ? computeIntlMonthCodeParts(intlCalendar, year1, month1)
        : computeIsoMonthCodeParts(year1, month1)
      monthDiff =
        monthCodeNumber1 - monthCodeNumber0 ||
        Number(isLeapYear1) - Number(isLeapYear0)

      if (Math.sign(monthDiff) === -sign) {
        const monthCorrect =
          sign < 0 &&
          -(intlCalendar
            ? computeIntlMonthsInYear(intlCalendar, year1)
            : computeIsoMonthsInYear(year1))

        year1 -= sign
        yearDiff = year1 - year0

        const month0Trunc = monthCodeNumberToMonth(
          monthCodeNumber0,
          isLeapYear0,
          intlCalendar ? computeIntlLeapMonth(intlCalendar, year1) : undefined,
        )
        monthDiff =
          month1 -
          month0Trunc +
          (monthCorrect ||
            (intlCalendar
              ? computeIntlMonthsInYear(intlCalendar, year1)
              : computeIsoMonthsInYear(year1)))
      }
    }
  }

  return [yearDiff, monthDiff, dayDiff]
}

function queryIntlCalendarMaybe(
  calendarId: string,
): IntlCalendar | undefined {
  return isIsoBasedCalendarId(calendarId)
    ? undefined
    : queryIntlCalendar(calendarId)
}

function isIsoBasedCalendarId(calendarId: string): boolean {
  return (
    calendarId === isoCalendarId ||
    calendarId === gregoryCalendarId ||
    calendarId === japaneseCalendarId
  )
}
