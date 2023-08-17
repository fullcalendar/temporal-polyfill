import { CalendarProtocol } from './calendar'
import { DateBag, DateBagStrict, DateGetterFields, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict, dateGetterRefiners } from './calendarFields'
import {
  createWrapperClass, getStrictInternals,
  idGettersStrict, WrapperInstance
} from './class'
import { Duration, createDuration } from './duration'
import { DurationInternals, durationTimeFieldDefaults } from './durationFields'
import { IsoDateFields } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import { Overflow, overflowMapNames } from './options'
import { ensureObjectlike } from './cast'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Unit, unitNamesAsc } from './units'
import { BoundArg, Callable, mapProps } from './utils'
import { isoCalendarId } from './calendarConfig'
import { queryCalendarImpl } from './calendarImpl'
import { validateFieldNames } from './calendarOps'

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
      const pd = createPlainDate({
        ...isoDateFields,
        calendar: queryCalendarImpl(isoCalendarId),
      })
      return refiner(calendar[propName](pd))
    })
  }, dateGetterRefiners) as {
    [K in keyof DateGetterFields]: (calendar: CalendarProtocol, isoFields: IsoDateFields) => DateGetterFields[K]
  },

  dateAdd(
    calendar: CalendarProtocol,
    isoDateFields: IsoDateInternals,
    durationInternals: DurationInternals,
    overflow?: Overflow
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateAdd(
        createPlainDate(isoDateFields),
        createDuration(durationInternals),
        Object.assign(
          Object.create(null),
          // guarantee an object. weird how dateFromFields passes through undefined
          overflow === undefined ? {} : { overflow: overflowMapNames[overflow] }
        )
      )
    )
  },

  dateUntil(
    calendar: CalendarProtocol,
    isoDateFields0: IsoDateFields,
    isoDateFields1: IsoDateFields,
    largestUnit: Unit
  ): DurationInternals {
    const durationInternals = getDurationInternals(
      calendar.dateUntil(
        createPlainDate(isoDateFields0 as IsoDateInternals),
        createPlainDate(isoDateFields1 as IsoDateInternals),
        Object.assign(
          Object.create(null),
          { largestUnit: unitNamesAsc[largestUnit] },
        )
      )
    )

    return {
      ...durationInternals,
      ...durationTimeFieldDefaults, // erase custom calendar's returned time fields
    }
  },

  dateFromFields(
    calendar: CalendarProtocol,
    fields: DateBag,
    overflow?: Overflow
  ): IsoDateInternals {
    return getPlainDateInternals(
      calendar.dateFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as DateBagStrict,
        overflow === undefined ? undefined : { overflow: overflowMapNames[overflow] }
      )
    )
  },

  yearMonthFromFields(
    calendar: CalendarProtocol,
    fields: YearMonthBag,
    overflow?: Overflow
  ): IsoDateInternals {
    return getPlainYearMonthInternals(
      calendar.yearMonthFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as YearMonthBagStrict,
        overflow === undefined ? undefined : { overflow: overflowMapNames[overflow] }
      )
    )
  },

  monthDayFromFields(
    calendar: CalendarProtocol,
    fields: MonthDayBag,
    overflow?: Overflow
  ): IsoDateInternals {
    return getPlainMonthDayInternals(
      calendar.monthDayFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as MonthDayBagStrict,
        overflow === undefined ? undefined : { overflow: overflowMapNames[overflow] }
      )
    )
  },

  fields(calendar: CalendarProtocol, fieldNames: Iterable<string>): string[] {
    const out = calendar.fields(fieldNames)
    validateFieldNames(out) // TODO: use the fieldNameSet to avoid reading twice?
    return [...out]
  },

  mergeFields(
    calendar: CalendarProtocol,
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    return ensureObjectlike(
      calendar.mergeFields(
        Object.assign(Object.create(null), fields0),
        Object.assign(Object.create(null), fields1),
      ),
    )
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
