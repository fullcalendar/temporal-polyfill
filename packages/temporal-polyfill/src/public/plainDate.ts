import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateFields, dateGetterNames } from '../internal/calendarFields'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  createZonedDateTimeConverter,
  mergePlainDateBag,
  refinePlainDateBag,
  rejectInvalidBag,
} from '../internal/convert'
import { diffPlainDates } from '../internal/diff'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { negateDurationInternals } from '../internal/durationFields'
import { IsoDateFields, isoDateFieldNames } from '../internal/isoFields'
import { IsoDatePublic, pluckIsoDateInternals, refineIsoDateInternals } from '../internal/isoInternals'
import { formatPlainDateIso } from '../internal/isoFormat'
import { createToLocaleStringMethods } from '../internal/intlFormat'
import { checkIsoDateTimeInBounds, compareIsoDateFields } from '../internal/isoMath'
import { isPlainDatesEqual } from '../internal/equality'
import { parsePlainDate } from '../internal/isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../internal/options'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { CalendarBranding, DurationBranding, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainYearMonthBranding, ZonedDateTimeBranding, ZonedDateTimeSlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from '../internal/slots'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { ensureString } from '../internal/cast'
import { refineCalendarSlot } from '../internal/calendarSlot'
import { zonedInternalsToIso } from '../internal/timeZoneSlot'
import { optionalToPlainTimeFields } from './publicUtils'
import { moveDateEasy } from '../internal/move'

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
      ...mergePlainDateBag(this, rejectInvalidBag(mod), prepareOptions(options)),
      branding: PlainDateBranding,
    })
  }

  withCalendar(calendarArg: CalendarArg): PlainDate {
    return createPlainDate({
      ...getPlainDateSlots(this),
      calendar: refineCalendarSlot(calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const slots = getPlainDateSlots(this)
    return createPlainDate({
      ...moveDateEasy(
        slots.calendar,
        slots,
        toDurationSlots(durationArg),
        options,
      ),
      calendar: slots.calendar,
      branding: PlainDateBranding,
    })
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const slots = getPlainDateSlots(this)
    return createPlainDate({
      ...moveDateEasy(
        slots.calendar,
        slots,
        negateDurationInternals(toDurationSlots(durationArg)),
        options,
      ),
      calendar: slots.calendar,
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
      ...convertToPlainMonthDay(this),
      branding: PlainMonthDayBranding,
    })
  }

  // not DRY
  getISOFields(): IsoDatePublic {
    const slots = getPlainDateSlots(this)
    return { // !!!
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainDateSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
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
  options = prepareOptions(options)

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
    return {
      ...refinePlainDateBag(arg as any, options),
      branding: PlainDateBranding,
    }
  }

  const res = { ...parsePlainDate(ensureString(arg)), branding: PlainDateBranding } // will validate arg
  refineOverflowOptions(options) // parse unused options
  return res
}
