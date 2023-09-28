import { CalendarProtocol } from './calendar'
import { DateBag, DateBagStrict, DateGetterFields, MonthDayBag, MonthDayBagStrict, YearMonthBag, YearMonthBagStrict, dateGetterRefiners } from './calendarFields'
import { createDuration, getDurationSlots } from './duration'
import { DurationInternals, durationTimeFieldDefaults } from './durationFields'
import { IsoDateFields } from './isoFields'
import { Overflow, overflowMapNames } from './options'
import { ensureObjectlike, ensureString } from './cast'
import { createPlainDate, getPlainDateSlots } from './plainDate'
import { Unit, unitNamesAsc } from './units'
import { Callable, defineProps, mapProps } from './utils'
import { isoCalendarId } from './calendarConfig'
import { queryCalendarImpl } from './calendarImpl'
import { DurationBranding, IsoDateSlots, PlainDateBranding } from './slots'
import { getPlainYearMonthSlots } from './plainYearMonth'
import { getPlainMonthDaySlots } from './plainMonthDay'
import { CalendarOps } from './calendarOps'

export class CalendarOpsAdapter implements CalendarOps {
  constructor(public c: CalendarProtocol) {}

  dateAdd(
    isoDateFields: IsoDateFields,
    durationInternals: DurationInternals,
    overflow?: Overflow
  ): IsoDateSlots {
    return getPlainDateSlots(
      this.c.dateAdd(
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
          // guarantee an object. weird how dateFromFields passes through undefined
          overflow === undefined ? {} : { overflow: overflowMapNames[overflow] }
        )
      )
    )
  }

  dateUntil(
    isoDateFields0: IsoDateFields,
    isoDateFields1: IsoDateFields,
    largestUnit: Unit
  ): DurationInternals {
    const durationInternals = getDurationSlots(
      this.c.dateUntil(
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
      )
    )

    return {
      ...durationInternals,
      ...durationTimeFieldDefaults, // erase custom calendar's returned time fields
    }
  }

  dateFromFields(
    fields: DateBag,
    overflow?: Overflow
  ): IsoDateSlots {
    return getPlainDateSlots(
      this.c.dateFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as DateBagStrict,
        overflow === undefined ? undefined : { overflow: overflowMapNames[overflow] }
      )
    )
  }

  yearMonthFromFields(
    fields: YearMonthBag,
    overflow?: Overflow
  ): IsoDateSlots {
    return getPlainYearMonthSlots(
      this.c.yearMonthFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as YearMonthBagStrict,
        overflow === undefined ? undefined : { overflow: overflowMapNames[overflow] }
      )
    )
  }

  monthDayFromFields(
    fields: MonthDayBag,
    overflow?: Overflow
  ): IsoDateSlots {
    return getPlainMonthDaySlots(
      this.c.monthDayFromFields(
        // TODO: make util
        Object.assign(Object.create(null), fields) as MonthDayBagStrict,
        overflow === undefined ? undefined : { overflow: overflowMapNames[overflow] }
      )
    )
  }

  fields(fieldNames: string[]): string[] {
    return [...this.c.fields(fieldNames)]
  }

  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    return ensureObjectlike(
      this.c.mergeFields(
        Object.assign(Object.create(null), fields0),
        Object.assign(Object.create(null), fields1),
      ),
    )
  }

  // TODO: DRY with getObjIdStrict
  get id(): string {
    return ensureString(this.c.id)
  }
}

type DateGetterFieldMethods = {
  [K in keyof DateGetterFields]: (isoFields: IsoDateFields) => DateGetterFields[K]
}

export interface CalendarOpsAdapter extends DateGetterFieldMethods {}

defineProps(
  CalendarOpsAdapter.prototype,
  mapProps((refiner: Callable, propName) => {
    return function(this: CalendarOpsAdapter, isoDateFields: IsoDateFields) {
      const pd = createPlainDate({
        ...isoDateFields,
        calendar: queryCalendarImpl(isoCalendarId),
        branding: PlainDateBranding,
      })
      return refiner(this.c[propName](pd))
    }
  }, dateGetterRefiners) as DateGetterFieldMethods
)
