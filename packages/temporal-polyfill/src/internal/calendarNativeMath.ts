import {
  gregoryCalendarId,
  isoCalendarId,
  japaneseCalendarId,
} from './calendarConfig'
import {
  YearMonthParts,
  getCalendarLeapMonthMeta,
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
import { OverflowOptions, refineOverflowOptions } from './optionsRefine'
import {
  checkIsoDateInBounds,
  epochMilliToIso,
  isoArgsToEpochMilli,
  isoToEpochMilli,
} from './timeMath'
import { Unit, givenFieldsToBigNano, milliInDay } from './units'
import {
  clampEntity,
  compareNumbers,
  divModTrunc,
  divTrunc,
  modTrunc,
} from './utils'

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

  days += givenFieldsToBigNano(
    durationFields,
    Unit.Hour,
    durationFieldNamesAsc,
  )[0]

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
    month = computeYearAddMonth(
      intlCalendar,
      monthCodeNumber,
      isLeapMonth,
      intlCalendar ? computeIntlLeapMonth(intlCalendar, year) : undefined,
      overflow,
    )
    month = clampEntity(
      'month',
      month,
      1,
      intlCalendar
        ? computeIntlMonthsInYear(intlCalendar, year)
        : computeIsoMonthsInYear(year),
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

function computeYearAddMonth(
  intlCalendar: IntlCalendar | undefined,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  targetLeapMonth: number | undefined,
  overflow: Overflow,
): number {
  if (isLeapMonth) {
    const leapMonthMeta = intlCalendar
      ? getCalendarLeapMonthMeta(intlCalendar)
      : undefined

    // Year arithmetic preserves the source monthCode. If the exact leap-month
    // code exists in the target year, use that ordinal month directly.
    if (
      targetLeapMonth !== undefined &&
      (leapMonthMeta! < 0 || targetLeapMonth === monthCodeNumber + 1)
    ) {
      return targetLeapMonth
    }

    // If the target year cannot represent the source leap month, reject mode
    // must fail instead of silently sliding to a neighboring ordinal month.
    if (overflow === Overflow.Reject) {
      throw new RangeError(errorMessages.invalidLeapMonth)
    }

    // Chinese/Dangi-style calendars constrain MxxL to the matching common Mxx.
    // Hebrew has a fixed Adar I leap slot; constraining it lands in common Adar.
    return leapMonthMeta! < 0 ? -leapMonthMeta! : monthCodeNumber
  }

  return monthCodeNumberToMonth(monthCodeNumber, false, targetLeapMonth)
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
      while (
        month > (monthsInYear = computeIntlMonthsInYear(intlCalendar, year))
      ) {
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

  if (largestUnit === Unit.Month) {
    const [months, days] = diffMonthDay(
      calendarId,
      intlCalendar,
      startIsoFields,
      endIsoFields,
      ...yearMonthDayStart,
      ...yearMonthDayEnd,
    )
    return { ...durationFieldDefaults, months, days }
  }

  let [years, months, days] = diffYearMonthDay(
    intlCalendar,
    ...yearMonthDayStart,
    ...yearMonthDayEnd,
  )

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
    months +=
      computeIntlMonthsInYear(intlCalendar, year + yearCorrection) * yearSign
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

function diffMonthDay(
  calendarId: string,
  intlCalendar: IntlCalendar | undefined,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): [monthDiff: number, dayDiff: number] {
  const sign = Math.sign(
    compareYearMonth(year1, month1, year0, month0) ||
      diffDays(startIsoFields, endIsoFields),
  )

  if (!sign) {
    return [0, 0]
  }

  // For largestUnit: "months", Temporal counts concrete calendar month slots.
  // In lunisolar calendars this must include inserted leap months instead of
  // collapsing everything to 12 month-code numbers per calendar year.
  let months = intlCalendar
    ? computeIntlMonthSpan(intlCalendar, year0, month0, year1, month1)
    : computeIsoMonthSpan(year0, month0, year1, month1)

  let anchorIsoFields = epochMilliToIso(
    monthAdd(calendarId, startIsoFields, 0, months, Overflow.Constrain),
  )

  // If moving by the raw month-slot distance passes the end date, back off one
  // month. This deliberately uses the full date comparison, which avoids
  // treating a constrained 30th -> 29th move as a complete calendar month.
  const anchorCompare = compareIsoDate(anchorIsoFields, endIsoFields)
  const anchorDateParts = intlCalendar
    ? computeIntlDateParts(intlCalendar, anchorIsoFields)
    : computeIsoDateParts(anchorIsoFields)
  if (
    anchorCompare === sign ||
    (anchorCompare === 0 &&
      anchorDateParts[2] !== day0 &&
      !isConstrainedFinalIntercalaryMonthDiff(
        intlCalendar,
        sign,
        year0,
        month0,
        day0,
        year1,
        month1,
        day1,
      ))
  ) {
    months -= sign
    anchorIsoFields = epochMilliToIso(
      monthAdd(calendarId, startIsoFields, 0, months, Overflow.Constrain),
    )
  }

  return [months, diffDays(anchorIsoFields, endIsoFields)]
}

function isConstrainedFinalIntercalaryMonthDiff(
  intlCalendar: IntlCalendar | undefined,
  sign: number,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): boolean {
  if (!intlCalendar) {
    return false
  }

  const monthsInYear0 = computeIntlMonthsInYear(intlCalendar, year0)
  const monthsInYear1 = computeIntlMonthsInYear(intlCalendar, year1)

  // Coptic/Ethiopic-style calendars have a real final intercalary month every
  // year: M13 exists in both common and leap years, but its length is 5 or 6
  // days. NonISODateUntil determines the year/month span before constraining
  // the day, so Coptic 1739-M13-06.since(1738-M13-05, { largestUnit: "months" })
  // should be 13 months, not 12 months + 6 days: adding -13 months from
  // 1739-M13-06 constrains exactly to 1738-M13-05. Ordinary Jan 31 -> Feb 28
  // wrapping still backs off because it changes monthCode instead of staying
  // on the same final intercalary month.
  return (
    sign < 0 &&
    monthsInYear0 > isoMonthsInYear &&
    monthsInYear1 > isoMonthsInYear &&
    month0 === monthsInYear0 &&
    month1 === monthsInYear1 &&
    day0 === computeIntlDaysInMonth(intlCalendar, year0, month0) &&
    day1 === computeIntlDaysInMonth(intlCalendar, year1, month1) &&
    day0 > day1
  )
}

function computeIsoMonthSpan(
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  return (year1 - year0) * isoMonthsInYear + month1 - month0
}

function computeIntlMonthSpan(
  intlCalendar: IntlCalendar,
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  const cmp = compareYearMonth(year0, month0, year1, month1)

  if (!cmp) {
    return 0
  }

  if (year0 === year1) {
    return month1 - month0
  }

  if (cmp < 0) {
    let months = computeIntlMonthsInYear(intlCalendar, year0) - month0 + month1
    for (let year = year0 + 1; year < year1; year++) {
      months += computeIntlMonthsInYear(intlCalendar, year)
    }
    return months
  }

  return -computeIntlMonthSpan(intlCalendar, year1, month1, year0, month0)
}

function compareYearMonth(
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  return compareNumbers(year0, year1) || compareNumbers(month0, month1)
}

function compareIsoDate(
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
): number {
  return (
    compareNumbers(isoFields0.isoYear, isoFields1.isoYear) ||
    compareNumbers(isoFields0.isoMonth, isoFields1.isoMonth) ||
    compareNumbers(isoFields0.isoDay, isoFields1.isoDay)
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

    // A constrained month move that would turn the original day into the last
    // day of a shorter month is not enough to earn a full month/year in a diff.
    // Compare against the original day, not the truncated target-month day.
    if (Math.sign(day1 - day0) === -sign) {
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
      monthDiff = computeYearBalanceMonthDiff(
        intlCalendar,
        sign,
        monthCodeNumber0,
        isLeapYear0,
        monthCodeNumber1,
        isLeapYear1,
      )

      if (Math.sign(monthDiff) === -sign) {
        const monthCorrect =
          sign < 0 &&
          -(intlCalendar
            ? computeIntlMonthsInYear(intlCalendar, year1)
            : computeIsoMonthsInYear(year1))

        year1 -= sign
        yearDiff = year1 - year0

        const month0Trunc = computeYearAddMonth(
          intlCalendar,
          monthCodeNumber0,
          isLeapYear0,
          intlCalendar ? computeIntlLeapMonth(intlCalendar, year1) : undefined,
          Overflow.Constrain,
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

function computeYearBalanceMonthDiff(
  intlCalendar: IntlCalendar | undefined,
  sign: number,
  monthCodeNumber0: number,
  isLeapMonth0: boolean,
  monthCodeNumber1: number,
  isLeapMonth1: boolean,
): number {
  const leapMonthMeta = intlCalendar
    ? getCalendarLeapMonthMeta(intlCalendar)
    : undefined

  if (leapMonthMeta !== undefined && leapMonthMeta < 0) {
    const fixedLeapMonth = -leapMonthMeta

    // Hebrew-style calendars have a fixed leap month before a common-month
    // counterpart. A leap-month source constrains to that common counterpart
    // across a year boundary, but the reverse direction remains a month short.
    if (
      sign > 0 &&
      isLeapMonth0 &&
      !isLeapMonth1 &&
      monthCodeNumber1 === fixedLeapMonth
    ) {
      return 0
    }
  } else if (leapMonthMeta !== undefined) {
    if (
      sign < 0 &&
      isLeapMonth0 &&
      !isLeapMonth1 &&
      monthCodeNumber1 === monthCodeNumber0
    ) {
      return 0
    }
  }

  return (
    monthCodeNumber1 - monthCodeNumber0 ||
    Number(isLeapMonth1) - Number(isLeapMonth0)
  )
}

function queryIntlCalendarMaybe(calendarId: string): IntlCalendar | undefined {
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
