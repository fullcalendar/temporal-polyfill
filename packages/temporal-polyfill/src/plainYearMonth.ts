import { CalendarArg, CalendarProtocol } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { YearMonthBag, yearMonthGetterNames } from './calendarFields'
import { getPublicCalendar } from './calendarPublic'
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
import { IsoDatePublic, getPublicIdOrObj, refineIsoYearMonthInternals } from './isoInternals'
import { formatIsoYearMonthFields, formatPossibleDate } from './isoFormat'
import { createToLocaleStringMethod } from './intlFormat'
import { compareIsoDateFields, moveByIsoDays } from './isoMath'
import { isPlainYearMonthsEqual } from './equality'
import { parsePlainYearMonth } from './isoParse'
import { DiffOptions, OverflowOptions, refineOverflowOptions } from './options'
import { PlainDate, createPlainDate } from './plainDate'
import { NumSign, defineGetters, defineProps, isObjectlike, pluckProps } from './utils'
import { DurationBranding, IsoDateSlots, PlainDateBranding, PlainYearMonthBranding, PlainYearMonthSlots, createCalendarGetterMethods, createCalendarIdGetterMethods, createViaSlots, getSlots, getSpecificSlots, neverValueOf, setSlots } from './slots'
import { ensureString } from './cast'

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

  toString() {
    return formatPossibleDate(formatIsoYearMonthFields, getPlainYearMonthSlots(this))
  }

  toJSON() { // not DRY
    return formatPossibleDate(formatIsoYearMonthFields, getPlainYearMonthSlots(this))
  }

  toPlainDate(bag: { day: number }): PlainDate {
    getPlainYearMonthSlots(this) // validate `this`
    return createPlainDate({
      branding: PlainDateBranding,
      ...convertPlainYearMonthToDate(this, bag)
    })
  }

  // not DRY
  getISOFields(): IsoDatePublic {
    const slots = getPlainYearMonthSlots(this)
    return {
      calendar: getPublicIdOrObj(slots.calendar) as any, // !!!
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots), // !!!
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    return getPublicCalendar(getPlainYearMonthSlots(this))
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

defineProps(PlainYearMonth.prototype, {
  [Symbol.toStringTag]: 'Temporal.' + PlainYearMonthBranding,
  toLocaleString: createToLocaleStringMethod(PlainYearMonthBranding),
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
    return { ...refinePlainYearMonthBag(arg as PlainYearMonthBag, options), branding: PlainYearMonthBranding }
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
      ? calendar.daysInMonth(internals)
      : 1,
  )
  const overflow = refineOverflowOptions(options)

  // TODO: this is very wasteful. think about breaking spec and just using `movePlainYearMonthToDay`
  return createPlainYearMonth({
    branding: PlainYearMonthBranding,
    ...convertToPlainYearMonth(
      createPlainDate({
        branding: PlainDateBranding,
        ...calendar.dateAdd(isoDateFields, durationInternals, overflow)
      }),
      overflow,
    )
  })
}

// TODO: DRY
function movePlainYearMonthToDay(internals: IsoDateSlots, day = 1): IsoDateFields {
  return moveByIsoDays(
    internals,
    day - internals.calendar.day(internals),
  )
}
