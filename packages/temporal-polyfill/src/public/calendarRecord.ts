import { DateBagStrict, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict } from '../internal/calendarFields'
import { ensureObjectlike, ensurePositiveInteger } from '../internal/cast'
import { DurationFieldsWithSign } from '../internal/durationFields'
import { IsoDateFields } from '../internal/isoFields'
import { overflowMapNames } from '../genericApi/options'
import { Unit, unitNamesAsc } from '../internal/units'
import { Overflow } from '../internal/options'
import { CalendarImpl } from '../internal/calendarImpl'
import { calendarImplDateAdd, calendarImplDateFromFields, calendarImplDateUntil, calendarImplDay, calendarImplDaysInMonth, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields, createCalendarImplRecord } from '../genericApi/calendarRecord'
import { DurationBranding, PlainDateBranding } from '../genericApi/branding'

// public
import { CalendarSlot } from './calendarSlot'
import { CalendarProtocol } from './calendar'
import { createDuration, getDurationSlots } from './duration'
import { createPlainDate, getPlainDateSlots } from './plainDate'
import { getPlainMonthDaySlots } from './plainMonthDay'
import { getPlainYearMonthSlots } from './plainYearMonth'

export function createCalendarSlotRecord<ProtocolMethods extends Record<string, (this: CalendarProtocol, ...args: any[]) => any>>(
  calendarSlot: CalendarSlot,
  protocolMethods: ProtocolMethods,
  implMethods: {
    [K in keyof ProtocolMethods]:
      ProtocolMethods[K] extends (this: CalendarProtocol, ...args: infer Args) => infer Ret
        ? (this: CalendarImpl, ...args: Args) => Ret
        : never
  },
): {
  [K in keyof ProtocolMethods]:
    ProtocolMethods[K] extends (this: CalendarProtocol, ...args: infer Args) => infer Ret
      ? (this: {}, ...args: Args) => Ret
      : never
} {
  if (typeof calendarSlot === 'string') {
    return createCalendarImplRecord(calendarSlot, implMethods) as any // !!!
  }

  return createCalendarProtocolRecord(calendarSlot, protocolMethods)
}

function createCalendarProtocolRecord<ProtocolMethods extends Record<string, (this: CalendarProtocol, ...args: any[]) => any>>(
  calendarProtocol: CalendarProtocol,
  protocolMethods: ProtocolMethods,
): {
  [K in keyof ProtocolMethods]:
    ProtocolMethods[K] extends (this: CalendarProtocol, ...args: infer Args) => infer Ret
      ? (...args: Args) => Ret
      : never
} {
  const calendarRecord: any = {}

  for (const methodName in protocolMethods) {
    calendarRecord[methodName] = protocolMethods[methodName].bind(calendarProtocol)
  }

  return calendarRecord
}

// Preconfigured Creators
// -------------------------------------------------------------------------------------------------

// date

export function createDateNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
  }, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  })
}

export function getDateModCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateFromFields: calendarProtocolDateFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  }, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function getMoveCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarProtocolDateAdd,
  }, {
    dateAdd: calendarImplDateAdd,
  })
}

export function getDiffCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
  }, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  })
}

// year month

export function createYearMonthNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
  }, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  })
}

export function createYearMonthModCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    yearMonthFromFields: calendarProtocolYearMonthFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  }, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function createYearMonthMoveCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarProtocolDateAdd,
    daysInMonth: calendarProtocolDaysInMonth,
    day: calendarProtocolDay,
  }, {
    dateAdd: calendarImplDateAdd,
    daysInMonth: calendarImplDaysInMonth,
    day: calendarImplDay,
  })
}

export function createYearMonthDiffCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
    day: calendarProtocolDay,
  }, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
    day: calendarImplDay,
  })
}

// month day

export function createMonthDayNewCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
  }, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  })
}

export function createMonthDayModCalendarRecord(calendarSlot: CalendarSlot) {
  return createCalendarSlotRecord(calendarSlot, {
    monthDayFromFields: calendarProtocolMonthDayFromFields,
    fields: calendarProtocolFields,
    mergeFields: calendarProtocolMergeFields,
  }, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

// Individual CalendarProtocol Methods
// -------------------------------------------------------------------------------------------------

export function calendarProtocolDateAdd(
  this: CalendarProtocol,
  isoDateFields: IsoDateFields,
  durationInternals: DurationFieldsWithSign,
  overflow: Overflow,
): IsoDateFields {
  return getPlainDateSlots(
    this.dateAdd(
      createPlainDate({
        ...isoDateFields,
        calendar: this,
        branding: PlainDateBranding, // go at to override what isoDateFields might provide!
      }),
      createDuration({
        ...durationInternals,
        branding: DurationBranding,
      }),
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolDateUntil(
  this: CalendarProtocol,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit,
): DurationFieldsWithSign {
  return getDurationSlots(
    this.dateUntil(
      createPlainDate({
        ...isoDateFields0,
        calendar: this,
        branding: PlainDateBranding,
      }),
      createPlainDate({
        ...isoDateFields1,
        calendar: this,
        branding: PlainDateBranding,
      }),
      Object.assign(
        Object.create(null),
        { largestUnit: unitNamesAsc[largestUnit] },
      )
    ),
  )
}

export function calendarProtocolDateFromFields(
  this: CalendarProtocol,
  fields: DateBagStrict,
  overflow: Overflow,
): IsoDateFields {
  return getPlainDateSlots(
    this.dateFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as DateBagStrict,
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolYearMonthFromFields(
  this: CalendarProtocol,
  fields: YearMonthBag,
  overflow: Overflow,
): IsoDateFields {
  return getPlainYearMonthSlots(
    this.yearMonthFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as YearMonthBagStrict,
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolMonthDayFromFields(
  this: CalendarProtocol,
  fields: MonthDayBag,
  overflow: Overflow,
): IsoDateFields {
  return getPlainMonthDaySlots(
    this.monthDayFromFields(
      // TODO: make util
      // only necessary if fabricating internally
      Object.assign(Object.create(null), fields) as MonthDayBagStrict,
      Object.assign(
        Object.create(null),
        { overflow: overflowMapNames[overflow] },
      )
    )
  )
}

export function calendarProtocolFields(
  this: CalendarProtocol,
  fieldNames: string[],
): string[] {
  return [...this.fields(fieldNames)]
}

export function calendarProtocolMergeFields(
  this: CalendarProtocol,
  fields0: Record<string, unknown>,
  fields1: Record<string, unknown>,
): Record<string, unknown> {
  return ensureObjectlike(
    this.mergeFields(
      Object.assign(Object.create(null), fields0),
      Object.assign(Object.create(null), fields1),
    ),
  )
}

export function calendarProtocolDay(
  this: CalendarProtocol,
  isoDateFields: IsoDateFields,
): number {
  return ensurePositiveInteger(
    this.day(
      createPlainDate({
        ...isoDateFields,
        calendar: this,
        branding: PlainDateBranding,
      })
    )
  )
}

export function calendarProtocolDaysInMonth(
  this: CalendarProtocol,
  isoDateFields: IsoDateFields,
): number {
  return ensurePositiveInteger(
    this.daysInMonth(
      createPlainDate({
        ...isoDateFields,
        calendar: this,
        branding: PlainDateBranding,
      })
    )
  )
}
