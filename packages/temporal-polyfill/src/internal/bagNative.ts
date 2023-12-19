import { isoCalendarId, japaneseCalendarId } from './calendarConfig'
import { DateBag, DayFields, EraYearOrYear, MonthFields, YearMonthBag, allYearFieldNames, eraYearFieldNames, monthDayFieldNames, monthFieldNames } from './calendarFields'
import { computeIsoDaysInMonth, isoMonthsInYear } from './calendarIso'
import { NativeDateRefineDeps, NativeMonthDayRefineOps, NativeYearMonthRefineDeps, eraYearToYear, getCalendarEraOrigins, getCalendarId, getCalendarLeapMonthMeta, monthCodeNumberToMonth, parseMonthCode } from './calendarNative'
import { IsoDateFields } from './calendarIsoFields'
import { isoEpochFirstLeapYear } from './calendarIso'
import { checkIsoDateInBounds, checkIsoYearMonthInBounds } from './epochAndTime'
import { Overflow } from './options'
import { clampEntity } from './utils'
import { OverflowOptions, refineOverflowOptions } from '../genericApi/optionsRefine'

// Would like to merge this file with convert.ts
// but convert.ts deals with option parsing. It needs to because it must ensure the bags
// are parsed BEFORE the options are parsed

export function nativeDateFromFields(
  this: NativeDateRefineDeps,
  fields: DateBag,
  options?: OverflowOptions,
): IsoDateFields & { calendar: string } {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const day = refineDay(this, fields as DayFields, month, year, overflow)
  const isoFields = this.isoFields(year, month, day)

  return {
    ...checkIsoDateInBounds(isoFields),
    calendar: getCalendarId(this),
  }
}

export function nativeYearMonthFromFields(
  this: NativeYearMonthRefineDeps,
  fields: YearMonthBag,
  options?: OverflowOptions,
): IsoDateFields & { calendar: string } {
  const overflow = refineOverflowOptions(options)
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const isoFields = this.isoFields(year, month, 1)

  return {
    ...checkIsoYearMonthInBounds(isoFields),
    calendar: getCalendarId(this),
  }
}

export function nativeMonthDayFromFields(
  this: NativeMonthDayRefineOps,
  fields: DateBag,
  options?: OverflowOptions
): IsoDateFields & { calendar: string } {
  const overflow = refineOverflowOptions(options)
  let isIso = getCalendarId(this) === isoCalendarId // HACK
  let { monthCode } = fields as Partial<MonthFields>
  let monthCodeNumber: number
  let isLeapMonth: boolean
  let year: number | undefined
  let month: number | undefined
  let day: number

  if (monthCode !== undefined) {
    [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)

    // simulate refineDay :(
    if (monthCodeNumber <= 0) {
      throw new RangeError('Below zero')
    }
    if (fields.day === undefined) {
      throw new TypeError('Must specify day')
    }
    day = fields.day

    const res = this.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
    if (!res) {
      throw new RangeError('Could not guess year')
    }
    [year, month] = res

    if (fields.month !== undefined && fields.month !== month) {
      throw new RangeError('Inconsistent month/monthCode')
    }
    if (isIso) {
      month = clampEntity(
        'month',
        month,
        1,
        isoMonthsInYear,
        Overflow.Reject, // always reject bad iso months
      )
      day = clampEntity(
        'day',
        day,
        1,
        computeIsoDaysInMonth(fields.year ?? year, month),
        overflow,
      )
    }

  } else {
    year = (fields.year === undefined && isIso)
      ? isoEpochFirstLeapYear
      : refineYear(this, fields as EraYearOrYear)

    month = refineMonth(this, fields, year, overflow)
    day = refineDay(this, fields as DayFields, month, year, overflow)

    const leapMonth = this.leapMonth(year)
    isLeapMonth = month === leapMonth
    monthCodeNumber = month - ( // TODO: more DRY with formatMonthCode
      (leapMonth && month >= leapMonth)
        ? 1
        : 0)

    const res = this.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
    if (!res) {
      throw new RangeError('Could not guess year')
    }
    [year, month] = res
  }

  return {
    ...this.isoFields(year, month, day),
    calendar: getCalendarId(this),
  }
}

function refineYear(
  calendarNative: NativeYearMonthRefineDeps,
  fields: DateBag
): number {
  let { era, eraYear, year } = fields
  const eraOrigins = getCalendarEraOrigins(calendarNative)

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throw new TypeError('Must define both era and eraYear')
    }

    if (!eraOrigins) {
      throw new RangeError('Does not accept era/eraYear')
    }

    const eraOrigin = eraOrigins[era]
    if (eraOrigin === undefined) {
      throw new RangeError('Unknown era')
    }

    const yearByEra = eraYearToYear(eraYear, eraOrigin)

    if (year !== undefined && year !== yearByEra) {
      throw new RangeError('The year and era/eraYear must agree')
    }

    year = yearByEra
  } else if (year === undefined) {
    throw new TypeError('Must specify year' + (eraOrigins ? ' or era/eraYear' : ''))
  }

  return year
}

function refineMonth(
  calendarNative: NativeYearMonthRefineDeps,
  fields: Partial<MonthFields>,
  year: number,
  overflow: Overflow
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = refineMonthCode(calendarNative, monthCode, year, overflow)

    if (month !== undefined && month !== monthByCode) {
      throw new RangeError('The month and monthCode do not agree')
    }

    month = monthByCode
    overflow = Overflow.Reject // monthCode parsing doesn't constrain
  } else if (month === undefined) {
    throw new TypeError('Must specify either month or monthCode')
  }

  // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
  if (month <= 0) {
    throw new RangeError('Below zero')
  }

  return clampEntity(
    'month',
    month,
    1,
    calendarNative.monthsInYearPart(year),
    overflow
  )
}

function refineMonthCode(
  calendarNative: NativeYearMonthRefineDeps,
  monthCode: string,
  year: number,
  overflow: Overflow,
) {
  const leapMonth = calendarNative.leapMonth(year)
  const [monthCodeNumber, wantsLeapMonth] = parseMonthCode(monthCode)
  let month = monthCodeNumberToMonth(monthCodeNumber, wantsLeapMonth, leapMonth)

  if (wantsLeapMonth) {
    const leapMonthMeta = getCalendarLeapMonthMeta(calendarNative)

    // calendar does not support leap years
    if (leapMonthMeta === undefined) {
      throw new RangeError('Calendar system doesnt support leap months')
    }

    // leap year has a maximum
    else if (leapMonthMeta > 0) {
      if (month > leapMonthMeta) {
        throw new RangeError('Invalid leap-month month code')
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError('Invalid leap-month month code')
        } else {
          month-- // M05L -> M05
        }
      }
    }

    // leap year is constant
    else {
      if (month !== -leapMonthMeta) {
        throw new RangeError('Invalid leap-month month code')
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError('Invalid leap-month month code')
        } else {
           // ex: M05L -> M06
        }
      }
    }
  }

  return month
}

function refineDay(
  calendarNative: NativeDateRefineDeps,
  fields: DayFields,
  month: number,
  year: number,
  overflow?: Overflow
): number {
  const { day } = fields

  if (day === undefined) {
    throw new TypeError('Must specify day')
  }

  // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
  if (day <= 0) {
    throw new RangeError('Below zero')
  }

  return clampEntity(
    'day',
    day,
    1,
    calendarNative.daysInMonthParts(year, month),
    overflow
  )
}

// -------------------------------------------------------------------------------------------------

export function nativeFieldsMethod(
  this: NativeYearMonthRefineDeps,
  fieldNames: string[],
): string[] {
  if (getCalendarEraOrigins(this) && fieldNames.includes('year')) {
    return [...fieldNames, ...eraYearFieldNames]
  }
  return fieldNames
}

export function nativeMergeFields(
  this: NativeYearMonthRefineDeps,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  if (getCalendarEraOrigins(this)) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // eras begin mid-year?
    if (getCalendarId(this) === japaneseCalendarId) {
      spliceFields(
        merged,
        additionalFields,
        monthDayFieldNames, // any found?
        eraYearFieldNames, // then, delete these
      )
    }
  }

  return merged
}

function spliceFields(
  dest: any,
  additional: any,
  allPropNames: string[],
  deletablePropNames?: string[],
): void {
  let anyMatching = false
  const nonMatchingPropNames: string[] = []

  for (const propName of allPropNames) {
    if (additional[propName] !== undefined) {
      anyMatching = true
    } else {
      nonMatchingPropNames.push(propName)
    }
  }

  Object.assign(dest, additional)

  if (anyMatching) {
    for (const deletablePropName of (deletablePropNames || nonMatchingPropNames)) {
      delete dest[deletablePropName]
    }
  }
}
