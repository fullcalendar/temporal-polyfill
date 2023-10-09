import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { YearMonthBag, yearMonthGetterNames } from './calendarFields'
import {
  convertPlainYearMonthToDate,
  convertToPlainYearMonth,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
} from './convert'
import {  diffPlainYearMonths } from './diff'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { DurationInternals, negateDurationInternals } from './durationFields'
import { IsoDateFields, isoDateFieldNames } from './isoFields'
import { IsoDatePublic, refineIsoYearMonthInternals } from './isoInternals'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { createToLocaleStringMethods } from './intlFormat'
import { compareIsoDateFields, moveByIsoDays } from './isoMath'
import { isPlainYearMonthsEqual } from './equality'
import { parsePlainYearMonth } from './isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineOverflowOptions } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from './utils'
import { CalendarBranding, DurationBranding, IsoDateSlots, PlainDateBranding, PlainYearMonthBranding, PlainYearMonthSlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from './slots'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { ensureString } from './cast'
import { calendarDateAdd, calendarDaysInMonth, calendarFieldFuncs } from './calendarSlot'

export type PlainYearMonthBag = YearMonthBag & { calendar?: CalendarArg }
export type PlainYearMonthMod = YearMonthBag
export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag | string

export class PlainYearMonth {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendar: CalendarArg = isoCalendarId,
    referenceIsoDay: number = 1
  ) {
    setSlots(this, {
      branding: PlainYearMonthBranding,
      ...refineIsoYearMonthInternals({
        isoYear,
        isoMonth,
        isoDay: referenceIsoDay,
        calendar,
      })
    })
  }

  with(mod: PlainYearMonthMod, options?: OverflowOptions): PlainYearMonth {
    getPlainYearMonthSlots(this) // validate `this`
    return createPlainYearMonth({
      branding: PlainYearMonthBranding,
      ...mergePlainYearMonthBag(this, mod, options)
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return movePlainYearMonth(
      getPlainYearMonthSlots(this),
      toDurationSlots(durationArg),
      options,
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return movePlainYearMonth(
      getPlainYearMonthSlots(this),
      negateDurationInternals(toDurationSlots(durationArg)),
      options,
    )
  }

  until(otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainYearMonths(getPlainYearMonthSlots(this), toPlainYearMonthSlots(otherArg), options)
    })
  }

  since(otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainYearMonths(getPlainYearMonthSlots(this), toPlainYearMonthSlots(otherArg), options, true)
    })
  }

  equals(otherArg: PlainYearMonthArg): boolean {
    return isPlainYearMonthsEqual(getPlainYearMonthSlots(this), toPlainYearMonthSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions) {
    return formatPossibleDate(formatIsoYearMonthFields, getPlainYearMonthSlots(this), options)
  }

  toJSON() { // not DRY
    return formatPossibleDate(formatIsoYearMonthFields, getPlainYearMonthSlots(this))
  }

  toPlainDate(bag: { day: number }): PlainDate {
    getPlainYearMonthSlots(this) // validate `this`
    return createPlainDate({
      ...convertPlainYearMonthToDate(this, bag),
      branding: PlainDateBranding,
    })
  }

  // not DRY
  getISOFields(): IsoDatePublic {
    const slots = getPlainYearMonthSlots(this)
    return { // !!!
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainYearMonthSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, calendar })
      : calendar
  }

  static from(arg: PlainYearMonthArg, options?: OverflowOptions): PlainYearMonth {
    return createPlainYearMonth(toPlainYearMonthSlots(arg, options))
  }

  static compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumSign {
    return compareIsoDateFields(
      toPlainYearMonthSlots(arg0),
      toPlainYearMonthSlots(arg1),
    )
  }
}

defineStringTag(PlainYearMonth.prototype, PlainYearMonthBranding)

defineProps(PlainYearMonth.prototype, {
  ...createToLocaleStringMethods(PlainYearMonthBranding),
  valueOf: neverValueOf,
})

defineGetters(PlainYearMonth.prototype, {
  ...createCalendarIdGetterMethods(PlainYearMonthBranding),
  ...createCalendarGetterMethods(PlainYearMonthBranding, yearMonthGetterNames),
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainYearMonth(slots: PlainYearMonthSlots): PlainYearMonth {
  return createViaSlots(PlainYearMonth, slots)
}

export function getPlainYearMonthSlots(plainYearMonth: PlainYearMonth): PlainYearMonthSlots {
  return getSpecificSlots(PlainYearMonthBranding, plainYearMonth) as PlainYearMonthSlots
}

export function toPlainYearMonthSlots(arg: PlainYearMonthArg, options?: OverflowOptions) {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots && slots.branding === PlainYearMonthBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainYearMonthSlots
    }
    return {
      ...refinePlainYearMonthBag(arg as PlainYearMonthBag, options),
      branding: PlainYearMonthBranding,
    }
  }
  refineOverflowOptions(options) // parse unused options
  return { ...parsePlainYearMonth(ensureString(arg)), branding: PlainYearMonthBranding }
}

// HARD to convert to new-style
function movePlainYearMonth(
  internals: IsoDateSlots,
  durationInternals: DurationInternals,
  options: OverflowOptions | undefined,
): PlainYearMonth {
  const { calendar } = internals
  const isoDateFields = movePlainYearMonthToDay(
    internals,
    durationInternals.sign < 0
      ? calendarDaysInMonth(calendar, internals)
      : 1,
  )

  const optionsCopy = { ...options } // safeguard against dateAdd mutation

  // TODO: this is very wasteful. think about breaking spec and just using `movePlainYearMonthToDay`
  return createPlainYearMonth({
    branding: PlainYearMonthBranding,
    ...convertToPlainYearMonth(
      createPlainDate({
        ...calendarDateAdd(calendar, isoDateFields, durationInternals, options),
        calendar,
        branding: PlainDateBranding,
      }),
      optionsCopy,
    )
  })
}

// TODO: DRY
function movePlainYearMonthToDay(internals: IsoDateSlots, day = 1): IsoDateFields {
  return moveByIsoDays(
    internals,
    day - calendarFieldFuncs.day(internals.calendar, internals),
  )
}
