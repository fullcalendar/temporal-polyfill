import { CalendarArg, CalendarProtocol } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateBag, DateFields, dateGetterNames } from './calendarFields'
import {
  queryCalendarOps,
} from './calendarOpsQuery'
import { getPublicCalendar } from './calendarPublic'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  createZonedDateTimeConverter,
  mergePlainDateBag,
  refinePlainDateBag,
} from './convert'
import { diffPlainDates } from './diff'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { negateDurationInternals } from './durationFields'
import {
  IsoDateFields,
  IsoTimeFields,
  isoDateFieldNames,
  isoTimeFieldDefaults,
} from './isoFields'
import { IsoDatePublic, getPublicIdOrObj, pluckIsoDateInternals, refineIsoDateInternals } from './isoInternals'
import { formatPlainDateIso } from './isoFormat'
import { createToLocaleStringMethods } from './intlFormat'
import { checkIsoDateTimeInBounds, compareIsoDateFields } from './isoMath'
import { isPlainDatesEqual } from './equality'
import { parsePlainDate } from './isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineOverflowOptions } from './options'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { zonedInternalsToIso } from './timeZoneOps'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from './utils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { DurationBranding, IsoDateSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainYearMonthBranding, ZonedDateTimeBranding, ZonedDateTimeSlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from './slots'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { ensureString } from './cast'

export type PlainDateBag = DateBag & { calendar?: CalendarArg }
export type PlainDateMod = DateBag
export type PlainDateArg = PlainDate | PlainDateBag | string

// only works with options object, not string timeZone name
const plainDateToZonedDateTimeConvert = createZonedDateTimeConverter((options: { plainTime?: PlainTimeArg }) => {
  return optionalToPlainTimeFields(options.plainTime)
})

export class PlainDate {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar: CalendarArg = isoCalendarId,
  ) {
    setSlots(this, {
      branding: PlainDateBranding,
      ...refineIsoDateInternals({
        isoYear,
        isoMonth,
        isoDay,
        calendar,
      })
    })
  }

  with(mod: PlainDateMod, options?: OverflowOptions): PlainDate {
    getPlainDateSlots(this) // validate `this`
    return createPlainDate({
      ...mergePlainDateBag(this, mod, options),
      branding: PlainDateBranding,
    })
  }

  withCalendar(calendarArg: CalendarArg): PlainDate {
    return createPlainDate({
      ...getPlainDateSlots(this),
      calendar: queryCalendarOps(calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const slots = getPlainDateSlots(this)
    return createPlainDate({
      ...slots.calendar.dateAdd(
        slots,
        toDurationSlots(durationArg),
        refineOverflowOptions(options),
      ),
      branding: PlainDateBranding,
    })
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const slots = getPlainDateSlots(this)
    return createPlainDate({
      ...slots.calendar.dateAdd(
        slots,
        negateDurationInternals(toDurationSlots(durationArg)),
        refineOverflowOptions(options),
      ),
      branding: PlainDateBranding,
    })
  }

  until(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainDates(getPlainDateSlots(this), toPlainDateSlots(otherArg), options),
    })
  }

  since(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainDates(getPlainDateSlots(this), toPlainDateSlots(otherArg), options, true),
    })
  }

  equals(otherArg: PlainDateArg): boolean {
    return isPlainDatesEqual(getPlainDateSlots(this), toPlainDateSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    return formatPlainDateIso(getPlainDateSlots(this), options)
  }

  toJSON(): string {
    return formatPlainDateIso(getPlainDateSlots(this))
  }

  toZonedDateTime(
    options: TimeZoneArg | { timeZone: TimeZoneArg, plainTime?: PlainTimeArg },
  ): ZonedDateTime {
    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      ...plainDateToZonedDateTimeConvert(
        getPlainDateSlots(this),
        isObjectlike(options) && !(options instanceof TimeZone)
          ? options as { timeZone: TimeZoneArg, plainTime?: PlainTimeArg }
          : { timeZone: options as TimeZoneArg }
      )
    })
  }

  toPlainDateTime(timeArg: PlainTimeArg): PlainDateTime {
    return createPlainDateTime({
      ...checkIsoDateTimeInBounds({
        ...getPlainDateSlots(this),
        ...optionalToPlainTimeFields(timeArg),
      }),
      branding: PlainDateTimeBranding,
    })
  }

  toPlainYearMonth(): PlainYearMonth {
    getPlainDateSlots(this) // validate `this`
    // TODO: this is very wasteful. think about breaking spec and just using `movePlainYearMonthToDay`
    return createPlainYearMonth({
      branding: PlainYearMonthBranding,
      ...convertToPlainYearMonth(this),
    })
  }

  toPlainMonthDay(): PlainMonthDay {
    getPlainDateSlots(this) // validate `this`
    return createPlainMonthDay({
      branding: PlainMonthDayBranding,
      ...convertToPlainMonthDay(this)
    })
  }

  // not DRY
  getISOFields(): IsoDatePublic {
    const slots = getPlainDateSlots(this)
    return {
      calendar: getPublicIdOrObj(slots.calendar) as any, // !!!
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots), // !!!
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    return getPublicCalendar(getPlainDateSlots(this))
  }

  static from(arg: any, options?: OverflowOptions): PlainDate {
    return createPlainDate(toPlainDateSlots(arg, options))
  }

  static compare(arg0: PlainDateArg, arg1: PlainDateArg): NumSign {
    return compareIsoDateFields(
      toPlainDateSlots(arg0),
      toPlainDateSlots(arg1),
    )
  }
}

export interface PlainDate extends DateFields {}

defineStringTag(PlainDate.prototype, PlainDateBranding)

defineProps(PlainDate.prototype, {
  ...createToLocaleStringMethods(PlainDateBranding),
  valueOf: neverValueOf,
})

defineGetters(PlainDate.prototype, {
  ...createCalendarIdGetterMethods(PlainDateBranding),
  ...createCalendarGetterMethods(PlainDateBranding, dateGetterNames),
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainDate(slots: PlainDateSlots): PlainDate {
  return createViaSlots(PlainDate, slots)
}

export function getPlainDateSlots(plainDate: PlainDate): PlainDateSlots {
  return getSpecificSlots(PlainDateBranding, plainDate) as PlainDateSlots
}

export function toPlainDateSlots(arg: PlainDateArg, options?: OverflowOptions): PlainDateSlots {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case PlainDateBranding:
          refineOverflowOptions(options) // parse unused options
          return slots as PlainDateSlots
        case PlainDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoDateInternals(slots as PlainDateTimeSlots), branding: PlainDateBranding }
        case ZonedDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoDateInternals(zonedInternalsToIso(slots as ZonedDateTimeSlots)), branding: PlainDateBranding }
      }
    }
    return { ...refinePlainDateBag(arg as PlainDateBag, options), branding: PlainDateBranding }
  }
  refineOverflowOptions(options) // parse unused options
  return { ...parsePlainDate(ensureString(arg)), branding: PlainDateBranding }
}

// TODO: DRY
function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeSlots(timeArg)
}
