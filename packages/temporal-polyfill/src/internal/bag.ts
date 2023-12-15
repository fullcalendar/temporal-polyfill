import { japaneseCalendarId } from './calendarConfig'
import { DateBag, DayFields, EraYearOrYear, MonthFields, YearMonthBag, eraYearFieldNamesAlpha, intlYearFieldNamesAlpha, monthDayFieldNamesAlpha, monthFieldNamesAlpha } from './calendarFields'
import { computeIsoYearMonthForMonthDay } from './calendarIso'
import { NativeDateRefineDeps, NativeMonthDayRefineOps, NativeYearMonthRefineDeps, eraYearToYear, monthCodeNumberToMonth, parseMonthCode } from './calendarNative'
import { IsoDateFields } from './isoFields'
import { checkIsoDateInBounds, checkIsoYearMonthInBounds, isoEpochFirstLeapYear } from './isoMath'
import { Overflow } from './options'
import { clampEntity } from './utils'

// Would like to merge this file with convert.ts
// but convert.ts deals with option parsing. It needs to because it must ensure the bags
// are parsed BEFORE the options are parsed

export function nativeDateFromFields(
  this: NativeDateRefineDeps,
  fields: DateBag,
  overflow: Overflow
): IsoDateFields {
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const day = refineDay(this, fields as DayFields, month, year, overflow)
  const isoFields = this.isoFields(year, month, day)

  return checkIsoDateInBounds(isoFields)
}

export function nativeYearMonthFromFields(
  this: NativeYearMonthRefineDeps,
  fields: YearMonthBag,
  overflow: Overflow
): IsoDateFields {
  const year = refineYear(this, fields)
  const month = refineMonth(this, fields, year, overflow)
  const isoFields = this.isoFields(year, month, 1)

  return checkIsoYearMonthInBounds(isoFields)
}

export function nativeMonthDayFromFields(
  this: NativeMonthDayRefineOps,
  fields: DateBag,
  overflow?: Overflow
): IsoDateFields {
  const easyMonthRefining = this.yearMonthForMonthDay === computeIsoYearMonthForMonthDay // HACK
  let { month, monthCode } = fields as Partial<MonthFields>
  let year
  let isLeapMonth
  let monthCodeNumber
  let day
  let calledRefineDay = false

  if (monthCode !== undefined) {
    [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)
    year = fields.year

    if (year !== undefined || easyMonthRefining) {
      // just for validation
      // year can be undefined
      month = refineMonth(this, fields, year!, overflow)
    } else {
      month = fields.month

      // without year, half-ass our validation...
      // TODO: improve
      if (monthCodeNumber <= 0) {
        throw new RangeError('Below zero')
      }

      // TODO: should be smarter for Intl calendars with leap-months? (use year if available?)
      if (month !== undefined && month !== monthCodeNumber) {
        throw new RangeError('Inconsistent month/monthCode')
      }
    }

    const maybeDay = fields.day
    if (maybeDay === undefined) {
      throw new TypeError('Must specify day')
    }

    day = maybeDay

    // half-ass validation
    if (overflow !== undefined &&
      year !== undefined &&
      month !== undefined) {
      // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
      if (day <= 0) {
        throw new RangeError('Below zero')
      }

      day = clampEntity(
        'day',
        day,
        1,
        this.daysInMonthParts(year, month),
        overflow
      )
    }
  } else {
    // derive monthCodeNumber/isLeapMonth from year/month, then discard year
    year = (fields.year === undefined && easyMonthRefining)
      ? isoEpochFirstLeapYear
      : refineYear(this, fields as EraYearOrYear)

    month = refineMonth(this, fields, year, overflow)
    day = refineDay(this, fields as DayFields, month, year, overflow)
    calledRefineDay = true

    const leapMonth = this.leapMonth(year)
    isLeapMonth = month === leapMonth
    monthCodeNumber = month - ( // TODO: more DRY with formatMonthCode
      (leapMonth && month >= leapMonth)
        ? 1
        : 0)
  }

  [year, month] = this.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)

  // HACK. TODO: more DRY with refineDay
  if (!calledRefineDay) {
    day = clampEntity(
      'day',
      day,
      1,
      this.daysInMonthParts(year, month),
      overflow
    )
  }

  return this.isoFields(year, month, day)
}

function refineYear(
  calendarNative: NativeYearMonthRefineDeps,
  fields: DateBag
): number {
  let { era, eraYear, year } = fields
  const eraOrigins = calendarNative.getEraOrigins()

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
  overflow?: Overflow
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
  overflow: Overflow | undefined
) {
  const leapMonth = calendarNative.leapMonth(year)
  const [monthCodeNumber, wantsLeapMonth] = parseMonthCode(monthCode)
  let month = monthCodeNumberToMonth(monthCodeNumber, wantsLeapMonth, leapMonth)

  if (wantsLeapMonth) {
    const leapMonthMeta = calendarNative.getLeapMonthMeta()

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
  if (this.getEraOrigins() && fieldNames.includes('era')) {
    return [...fieldNames, ...eraYearFieldNamesAlpha]
  }
  return fieldNames
}

export function nativeMergeFields(
  this: NativeYearMonthRefineDeps,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNamesAlpha)

  if (this.getEraOrigins()) {
    spliceFields(merged, additionalFields, intlYearFieldNamesAlpha)

    // eras begin mid-year?
    if ((this as any).idBase === japaneseCalendarId) {
      spliceFields(
        merged,
        additionalFields,
        monthDayFieldNamesAlpha, // any found?
        eraYearFieldNamesAlpha, // then, delete these
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
