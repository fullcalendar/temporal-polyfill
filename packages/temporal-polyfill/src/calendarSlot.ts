import { CalendarArg, CalendarProtocol, checkCalendarProtocol } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateBagStrict, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict, dateFieldOnlyRefiners } from './calendarFields'
import { queryCalendarImpl } from './calendarImpl'
import { ensureBoolean, ensureInteger, ensureObjectlike, ensurePositiveInteger, ensureString } from './cast'
import { createDuration, getDurationSlots } from './duration'
import { DurationInternals } from './durationFields'
import { IsoDateFields } from './isoFields'
import { parseCalendarId } from './isoParse'
import { OverflowOptions, refineOverflowOptions } from './options'
import { createPlainDate, getPlainDateSlots } from './plainDate'
import { getPlainMonthDaySlots } from './plainMonthDay'
import { getPlainYearMonthSlots } from './plainYearMonth'
import { CalendarBranding, DurationBranding, PlainDateBranding, getSlots } from './slots'
import { Unit, unitNamesAsc } from './units'
import { isObjectlike, mapProps } from './utils'

export type CalendarSlot = CalendarProtocol | string

export function refineCalendarSlot(calendarArg: CalendarArg): CalendarSlot {
  if (isObjectlike(calendarArg)) {
    // look at other date-like objects
    const slots = getSlots(calendarArg)
    if (slots && slots.branding !== CalendarBranding && (slots as any).calendar) {
      return (slots as any).calendar
    }

    checkCalendarProtocol(calendarArg as CalendarProtocol)
    return calendarArg as CalendarProtocol
  }
  return refineCalendarSlotString(calendarArg)
}

export function refineCalendarSlotString(calendarArg: string): string {
  return parseCalendarId(ensureString(calendarArg)) // ensures its real calendar via queryCalendarImpl
}

export function getCommonCalendarSlot(a: CalendarSlot, b: CalendarSlot): CalendarSlot {
  if (!isCalendarSlotsEqual(a, b)) {
    throw new RangeError('Calendars must be the same')
  }

  return a
}

export function isCalendarSlotsEqual(a: CalendarSlot, b: CalendarSlot): boolean {
  // fast path. doesn't read IDs
  if (a === b) {
    return true
  }

  const aId = getCalendarSlotId(a)
  const bId = getCalendarSlotId(b)

  return aId === bId
}

export function getPreferredCalendarSlot(a: CalendarSlot, b: CalendarSlot): CalendarSlot {
  // fast path. doesn't read IDs
  if (a === b) {
    return a
  }

  const aId = getCalendarSlotId(a)
  const bId = getCalendarSlotId(b)

  if (aId !== isoCalendarId) {
    if (aId !== bId && bId !== isoCalendarId) {
      throw new RangeError('Incompatible calendars')
    }

    return a
  }

  return b
}

// TODO: use elsewhere too!!!
export function getCalendarSlotId(calendarSlot: CalendarSlot): string {
  return typeof calendarSlot === 'string'
    ? calendarSlot
    : ensureString(calendarSlot.id)
}

export function calendarDateAdd(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
  durationInternals: DurationInternals,
  options?: OverflowOptions,
): IsoDateFields {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).dateAdd(
      isoDateFields,
      durationInternals,
      refineOverflowOptions(options),
    )
  }
  return getPlainDateSlots(
    calendarSlot.dateAdd(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding, // go at to override what isoDateFields might provide!
      }),
      createDuration({
        ...durationInternals,
        branding: DurationBranding,
      }),
      options,
    )
  )
}

export function calendarDateUntil(
  calendarSlot: CalendarSlot,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
): DurationInternals {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).dateUntil(
      isoDateFields0,
      isoDateFields1,
      largestUnit,
    )
  }
  return getDurationSlots(
    calendarSlot.dateUntil(
      createPlainDate({
        ...isoDateFields0,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      }),
      createPlainDate({
        ...isoDateFields1,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      }),
      Object.assign(
        Object.create(null),
        { largestUnit: unitNamesAsc[largestUnit] },
      )
    ),
  )
}

/*
Expects pre-parsed fields
*/
export function calendarDateFromFields(
  calendarSlot: CalendarSlot,
  fields: DateBagStrict,
  options?: OverflowOptions,
): IsoDateFields {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).dateFromFields(
      fields,
      refineOverflowOptions(options),
    )
  }
  return getPlainDateSlots(
    calendarSlot.dateFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as DateBagStrict,
      options,
    )
  )
}

/*
Expects pre-parsed fields
*/
export function calendarYearMonthFromFields(
  calendarSlot: CalendarSlot,
  fields: YearMonthBag,
  options?: OverflowOptions,
): IsoDateFields {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).yearMonthFromFields(
      fields,
      refineOverflowOptions(options),
    )
  }
  return getPlainYearMonthSlots(
    calendarSlot.yearMonthFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as YearMonthBagStrict,
      options,
    )
  )
}

/*
Expects pre-parsed fields
*/
export function calendarMonthDayFromFields(
  calendarSlot: CalendarSlot,
  fields: MonthDayBag,
  options?: OverflowOptions,
): IsoDateFields {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).monthDayFromFields(
      fields,
      refineOverflowOptions(options),
    )
  }
  return getPlainMonthDaySlots(
    calendarSlot.monthDayFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as MonthDayBagStrict,
      options,
    )
  )
}

export function calendarFields(
  calendarSlot: CalendarSlot,
  fieldNames: string[],
): string[] {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).fields(fieldNames)
  }
  return [...calendarSlot.fields(fieldNames)]
}

export function calendarMergeFields(
  calendarSlot: CalendarSlot,
  fields0: Record<string, unknown>,
  fields1: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).mergeFields(fields0, fields1)
  }
  return ensureObjectlike(
    calendarSlot.mergeFields(
      Object.assign(Object.create(null), fields0),
      Object.assign(Object.create(null), fields1),
    ),
  )
}

export const calendarFieldFuncs = mapProps((refinerFunc: any, propName) => {
  return (
    calendarSlot: CalendarSlot,
    isoDateFields: IsoDateFields,
  ): any => {
    if (typeof calendarSlot === 'string') {
      return queryCalendarImpl(calendarSlot)[propName](isoDateFields)
    }
    return refinerFunc(
      calendarSlot[propName](
        createPlainDate({
          ...isoDateFields,
          calendar: calendarSlot,
          branding: PlainDateBranding,
        })
      )
    )
  }
}, dateFieldOnlyRefiners)

// year stats

export function calendarDaysInYear(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).daysInYear(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.daysInYear(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarInLeapYear(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): boolean {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).inLeapYear(isoDateFields)
  }
  return ensureBoolean(
    calendarSlot.inLeapYear(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarMonthsInYear(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).monthsInYear(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.monthsInYear(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

// year+month stats

export function calendarDaysInMonth(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).daysInMonth(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.daysInMonth(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

// year+month+date stats

export function calendarDayOfWeek(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).dayOfWeek(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.dayOfWeek(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarDayOfYear(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).dayOfYear(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.dayOfYear(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarWeekOfYear(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).weekOfYear(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.weekOfYear(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarYearOfWeek(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).yearOfWeek(isoDateFields)
  }
  return ensureInteger( // allows negative
    calendarSlot.yearOfWeek(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarDaysInWeek(
  calendarSlot: CalendarSlot,
  isoDateFields: IsoDateFields,
): number {
  if (typeof calendarSlot === 'string') {
    return queryCalendarImpl(calendarSlot).daysInWeek(isoDateFields)
  }
  return ensurePositiveInteger(
    calendarSlot.daysInWeek(
      createPlainDate({
        ...isoDateFields,
        calendar: calendarSlot,
        branding: PlainDateBranding,
      })
    )
  )
}
