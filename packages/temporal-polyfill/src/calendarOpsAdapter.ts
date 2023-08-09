import { CalendarProtocol } from './calendar'
import { DateBag, DateBagStrict, DateGetterFields, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict, dateGetterRefiners } from './calendarFields'
import {
  createWrapperClass, getStrictInternals,
  idGettersStrict, WrapperInstance
} from './class'
import { Duration, createDuration } from './duration'
import { DurationInternals } from './durationFields'
import { IsoDateFields } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import { Overflow, overflowMapNames } from './options'
import { ensureObjectlike, ensureString } from './cast'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Unit, unitNamesAsc } from './units'
import { BoundArg, Callable, mapProps } from './utils'

const getPlainDateInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [PlainDate],
  IsoDateInternals // return
>(undefined, PlainDate)

const getPlainYearMonthInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [PlainYearMonth],
  IsoDateInternals // return
>(undefined, PlainYearMonth)

const getPlainMonthDayInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [PlainMonthDay],
  IsoDateInternals // return
>(undefined, PlainMonthDay)

const getDurationInternals = getStrictInternals.bind<
  undefined, [BoundArg],
  [Duration],
  DurationInternals // return
>(undefined, Duration)

const calendarOpsAdapterMethods = {
  /*
  TODO: due to era/eraYear-related 'crap' hack, ensure not accessed?
  */
  ...mapProps((refiner: Callable, propName) => {
    return ((calendar: CalendarProtocol, isoDateFields: IsoDateFields) => {
      // HACK: hopefully `calendar` not accessed
      const pd = createPlainDate(isoDateFields as IsoDateInternals)
      return refiner(calendar[propName](pd))
    })
  }, dateGetterRefiners) as {
    [K in keyof DateGetterFields]: (calendar: CalendarProtocol, isoFields: IsoDateFields) => DateGetterFields[K]
  },

  dateAdd(
    calendar: CalendarProtocol,
    isoDateFields: IsoDateInternals,
    durationInternals: DurationInternals,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateAdd(
        createPlainDate(isoDateFields),
        createDuration(durationInternals),
        { overflow: overflowMapNames[overflow] }
      )
    )
  },

  dateUntil(
    calendar: CalendarProtocol,
    isoDateFields0: IsoDateFields,
    isoDateFields1: IsoDateFields,
    largestUnit: Unit
  ): DurationInternals {
    return getDurationInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0 as IsoDateInternals),
        createPlainDate(isoDateFields1 as IsoDateInternals),
        { largestUnit: unitNamesAsc[largestUnit] }
      )
    )
  },

  dateFromFields(
    calendar: CalendarProtocol,
    fields: DateBag,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as DateBagStrict,
        { overflow: overflowMapNames[overflow] }
      )
    )
  },

  yearMonthFromFields(
    calendar: CalendarProtocol,
    fields: YearMonthBag,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainYearMonthInternals(
      calendar.yearMonthFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as YearMonthBagStrict,
        { overflow: overflowMapNames[overflow] }
      )
    )
  },

  monthDayFromFields(
    calendar: CalendarProtocol,
    fields: MonthDayBag,
    overflow: Overflow
  ): IsoDateInternals {
    return getPlainMonthDayInternals(
      calendar.monthDayFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as MonthDayBagStrict,
        { overflow: overflowMapNames[overflow] }
      )
    )
  },

  fields(calendar: CalendarProtocol, fieldNames: string[]): string[] {
    fieldNames = [...calendar.fields(fieldNames)] // TODO: kill ensureArray elsewhere?
      .map(ensureString)

    const fieldNameSet = new Set(fieldNames)
    if (fieldNameSet.size !== fieldNames.length) {
      throw new RangeError('Duplicate fields')
    }
    if (fieldNameSet.has('constructor')) {
      throw new RangeError('Cant have constructor field')
    }
    if (fieldNameSet.has('__proto__')) {
      throw new RangeError('Cant have __proto__ field')
    }

    return fieldNames
  },

  mergeFields(
    calendar: CalendarProtocol,
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    return ensureObjectlike(calendar.mergeFields(fields0, fields1))
  },
}

export type CalendarOpsAdapter = WrapperInstance<
  CalendarProtocol, // internals
  typeof idGettersStrict, // getters
  typeof calendarOpsAdapterMethods // methods
>

export const CalendarOpsAdapter = createWrapperClass<
  [CalendarProtocol],
  CalendarProtocol,
  typeof idGettersStrict,
  typeof calendarOpsAdapterMethods // methods
>(idGettersStrict, calendarOpsAdapterMethods)
