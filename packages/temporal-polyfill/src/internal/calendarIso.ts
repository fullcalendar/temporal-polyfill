import { isoArgsToEpochMilli, isoToEpochMilli, isoToLegacyDate } from './epochAndTime'
import { IsoDateFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { diffEpochMilliByDay } from './diff'
import { modFloor } from './utils'
import { DateParts, EraParts, MonthCodeParts, YearMonthParts } from './calendarNative'

export const isoEpochOriginYear = 1970
export const isoEpochFirstLeapYear = 1972
export const isoMonthsInYear = 12
export const isoDaysInWeek = 7

export function computeIsoYear(isoFields: IsoDateFields): number {
  return isoFields.isoYear
}

export function computeIsoMonth(isoFields: IsoDateFields): number {
  return isoFields.isoMonth
}

export function computeIsoDay(isoFields: IsoDateFields): number {
  return isoFields.isoDay
}

export function computeIsoEraParts(): EraParts {
  return [undefined, undefined]
}

export function computeIsoDateParts(isoFields: IsoDateFields): DateParts {
  return [isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay]
}

export function computeIsoMonthCodeParts(isoYear: number, isoMonth: number): MonthCodeParts {
  return [isoMonth, false]
}

export function computeIsoYearMonthForMonthDay(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): YearMonthParts | undefined {
  if (!isLeapMonth) {
    return [isoEpochFirstLeapYear, monthCodeNumber]
  }
}

export function computeIsoFieldsFromParts(year: number, month: number, day: number): IsoDateFields {
  return { isoYear: year, isoMonth: month, isoDay: day }
}

export function computeIsoEpochMilli(year: number, month?: number, day?: number): number {
  const epochMilli = isoArgsToEpochMilli(year, month, day)
  if (epochMilli === undefined) { // YUCK!!!
    throw new RangeError('Out of range')
  }
  return epochMilli
}

export function computeIsoDaysInWeek(isoDateFields: IsoDateFields) {
  return isoDaysInWeek
}

export function computeIsoMonthsInYear(isoYear: number): number { // for methods
  return isoMonthsInYear
}

export function computeIsoDaysInMonth(isoYear: number, isoMonth: number): number {
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

export function computeIsoDayOfYear(isoDateFields: IsoDateFields): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(isoDateYearStart(isoDateFields))!,
    isoToEpochMilli({ ...isoDateFields, ...isoTimeFieldDefaults })!, // YUCK
  ) + 1
}

export function computeIsoDayOfWeek(isoDateFields: IsoDateFields): number {
  const [legacyDate, nudge] = isoToLegacyDate(
    isoDateFields.isoYear,
    isoDateFields.isoMonth,
    isoDateFields.isoDay,
  )

  return modFloor(legacyDate.getDay() + 1 - nudge, 7) || 7
}

export function computeIsoYearOfWeek(isoDateFields: IsoDateFields): number {
  return computeIsoWeekParts(isoDateFields)[0]
}

export function computeIsoWeekOfYear(isoDateFields: IsoDateFields): number {
  return computeIsoWeekParts(isoDateFields)[1]
}

type WeekParts = [
  isoYear: number,
  isoWeek: number,
]

function computeIsoWeekParts(isoDateFields: IsoDateFields): WeekParts {
  const doy = computeIsoDayOfYear(isoDateFields)
  const dow = computeIsoDayOfWeek(isoDateFields)
  const doj = computeIsoDayOfWeek(isoDateYearStart(isoDateFields))
  const isoWeek = Math.floor((doy - dow + 10) / isoDaysInWeek)
  const { isoYear } = isoDateFields

  if (isoWeek < 1) {
    return [
      isoYear - 1,
      (doj === 5 || (doj === 6 && computeIsoInLeapYear(isoYear - 1))) ? 53 : 52,
    ]
  }
  if (isoWeek === 53) {
    if (computeIsoDaysInYear(isoYear) - doy < 4 - dow) {
      return [
        isoYear + 1,
        1,
      ]
    }
  }

  return [isoYear, isoWeek]
}

function isoDateYearStart(isoDateFields: IsoDateFields): IsoDateFields {
  return {
    ...isoDateFields,
    isoMonth: 1,
    isoDay: 1,
    ...isoTimeFieldDefaults, // needed?
  }
}
