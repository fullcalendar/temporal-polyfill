import { isoArgsToEpochMilli, isoToEpochMilli, isoToLegacyDate } from './epochAndTime'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { diffEpochMilliByDay } from './diff'
import { clampProp, createLazyGenerator, isClamped, modFloor } from './utils'
import { DateParts, EraParts, MonthCodeParts, NativeCalendar, YearMonthParts } from './calendarNative'
import { gregoryCalendarId, japaneseCalendarId } from './calendarConfig'
import { buildIntlFormat, parseIntlYear } from './calendarIntl'
import { hashIntlFormatParts } from './formatIntl'
import { Overflow } from './options'

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

// Era (complicated stuff)
// -------------------------------------------------------------------------------------------------

export function computeIsoEraParts(this: NativeCalendar, isoFields: IsoDateFields): EraParts {
  if (this.id === gregoryCalendarId) {
    return computeGregoryEraParts(isoFields)
  }

  if (this.id === japaneseCalendarId) {
    return queryJapaneseEraParts(isoFields)
  }

  return [undefined, undefined] // iso
}

function computeGregoryEraParts({ isoYear }: IsoDateFields): EraParts {
  if (isoYear < 1) {
    return ['bce', -isoYear + 1]
  }
  return ['ce', isoYear]
}

const queryJapaneseEraParts = createLazyGenerator(computeJapaneseEraParts, WeakMap)
const primaryJapaneseEraMilli = isoArgsToEpochMilli(1868, 9, 8)!
let japeneseEraFormat: Intl.DateTimeFormat

function computeJapaneseEraParts(isoFields: IsoDateFields): EraParts {
  const epochMilli = isoToEpochMilli(isoFields)!

  if (epochMilli < primaryJapaneseEraMilli) {
    return computeGregoryEraParts(isoFields)
  }

  japeneseEraFormat ||= buildIntlFormat(japaneseCalendarId)
  const intlPartsHash = hashIntlFormatParts(japeneseEraFormat, epochMilli)
  const { era, eraYear } = parseIntlYear(intlPartsHash, japaneseCalendarId)
  return [era, eraYear]
}

// Checking Fields
// -------------------------------------------------------------------------------------------------

export function checkIsoDateTimeFields<P extends IsoDateTimeFields>(isoDateTimeFields: P): P {
  checkIsoDateFields(isoDateTimeFields)
  constrainIsoTimeFields(isoDateTimeFields, Overflow.Reject)
  return isoDateTimeFields
}

export function checkIsoDateFields<P extends IsoDateFields>(isoInternals: P): P {
  if (!isIsoDateFieldsValid(isoInternals)) {
    throw new RangeError('Invalid iso date') // TODO: more DRY
  }
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: IsoDateFields): boolean {
  const { isoYear, isoMonth, isoDay } = isoFields

  return isClamped(isoMonth, 1, computeIsoMonthsInYear(isoYear)) && // TODO: use just 12
    isClamped(isoDay, 1, computeIsoDaysInMonth(isoYear, isoMonth))
}

// Constraining
// -------------------------------------------------------------------------------------------------

export function constrainIsoTimeFields(
  isoTimeFields: IsoTimeFields,
  overflow: Overflow | undefined,
): IsoTimeFields {
  // TODO: clever way to compress this, using functional programming
  // Will this kill need for clampProp?
  return {
    isoHour: clampProp(isoTimeFields, 'isoHour', 0, 23, overflow),
    isoMinute: clampProp(isoTimeFields, 'isoMinute', 0, 59, overflow),
    isoSecond: clampProp(isoTimeFields, 'isoSecond', 0, 59, overflow),
    isoMillisecond: clampProp(isoTimeFields, 'isoMillisecond', 0, 999, overflow),
    isoMicrosecond: clampProp(isoTimeFields, 'isoMicrosecond', 0, 999, overflow),
    isoNanosecond: clampProp(isoTimeFields, 'isoNanosecond', 0, 999, overflow),
  }
}
