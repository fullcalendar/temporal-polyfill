import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag, yearMonthGetterNames } from '../internal/calendarFields'
import { diffDates } from '../internal/diff'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { DurationInternals, negateDurationInternals, updateDurationFieldsSign } from '../internal/durationFields'
import { IsoDateFields, isoDateFieldNames } from '../internal/isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from '../internal/isoFormat'
import { createToLocaleStringMethods } from '../internal/intlFormat'
import { compareIsoDateFields, moveByIsoDays } from '../internal/isoMath'
import { parsePlainYearMonth } from '../internal/isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineDiffOptions, refineOverflowOptions } from '../internal/options'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { ensureString } from '../internal/cast'
import { calendarImplDateAdd, calendarImplDateUntil, calendarImplDay, calendarImplDaysInMonth } from '../internal/calendarRecordSimple'
import { Unit } from '../internal/units'
import { CalendarDayFunc } from '../internal/calendarRecordTypes'

// public
import {
  convertPlainYearMonthToDate,
  mergePlainYearMonthBag,
  refinePlainYearMonthBag,
  rejectInvalidBag,
} from './convert'
import { CalendarBranding, DurationBranding, IsoDateSlots, PlainDateBranding, PlainYearMonthBranding, PlainYearMonthSlots, createViaSlots, getSlots, getSpecificSlots, setSlots, refineIsoYearMonthSlots, IsoDatePublic } from './slots'
import { calendarProtocolDateAdd, calendarProtocolDateUntil, calendarProtocolDay, calendarProtocolDaysInMonth, createCalendarSlotRecord } from './calendarRecordComplex'
import { getCalendarSlotId, getCommonCalendarSlot, isCalendarSlotsEqual } from './calendarSlot'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { PlainDate, createPlainDate } from './plainDate'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'

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
      ...refineIsoYearMonthSlots({
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
      ...mergePlainYearMonthBag(this, rejectInvalidBag(mod), prepareOptions(options))
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
    const slots = getPlainYearMonthSlots(this)

    return formatPossibleDate(
      getCalendarSlotId(slots.calendar),
      formatIsoYearMonthFields,
      slots,
      options,
    )
  }

  toJSON() { // not DRY
    const slots = getPlainYearMonthSlots(this)

    return formatPossibleDate(
      getCalendarSlotId(slots.calendar),
      formatIsoYearMonthFields,
      slots,
    )
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
      ? createCalendar({ branding: CalendarBranding, id: calendar })
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
  options = prepareOptions(options)

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

  const res = { ...parsePlainYearMonth(ensureString(arg)), branding: PlainYearMonthBranding }
  refineOverflowOptions(options) // parse unused options
  return res
}

/*
TODO: move to move.ts
*/
function movePlainYearMonth(
  internals: IsoDateSlots,
  durationInternals: DurationInternals,
  options: OverflowOptions = Object.create(null), // b/c CalendarProtocol likes empty object
): PlainYearMonth {
  const { calendar } = internals
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateAdd: calendarImplDateAdd,
    daysInMonth: calendarImplDaysInMonth,
    day: calendarImplDay,
  }, {
    dateAdd: calendarProtocolDateAdd,
    daysInMonth: calendarProtocolDaysInMonth,
    day: calendarProtocolDay,
  })

  const isoDateFields = movePlainYearMonthToDay(
    calendarRecord,
    internals,
    durationInternals.sign < 0
      ? calendarRecord.daysInMonth(internals)
      : 1,
  )

  const movedIsoDateFields = calendarRecord.dateAdd(isoDateFields, durationInternals, options)

  return createPlainYearMonth({
    ...movePlainYearMonthToDay(calendarRecord, movedIsoDateFields),
    calendar,
    branding: PlainYearMonthBranding,
  })
}

function diffPlainYearMonths(
  internals0: IsoDateSlots,
  internals1: IsoDateSlots,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationInternals {
  const calendar = getCommonCalendarSlot(internals0.calendar, internals1.calendar)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
    day: calendarImplDay,
  }, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
    day: calendarProtocolDay,
  })

  let durationInternals = updateDurationFieldsSign(
    diffDates(
      calendarRecord,
      movePlainYearMonthToDay(calendarRecord, internals0),
      movePlainYearMonthToDay(calendarRecord, internals1),
      ...refineDiffOptions(invert, options, Unit.Year, Unit.Year, Unit.Month),
      options,
    ),
  )

  if (invert) {
    durationInternals = negateDurationInternals(durationInternals)
  }

  return durationInternals
}

// TODO: DRY
function movePlainYearMonthToDay(
  calendarRecord: { day: CalendarDayFunc },
  isoFields: IsoDateFields,
  day = 1,
): IsoDateFields {

  return moveByIsoDays(
    isoFields,
    day - calendarRecord.day(isoFields),
  )
}

export function isPlainYearMonthsEqual(
  a: IsoDateSlots,
  b: IsoDateSlots
): boolean {
  return !compareIsoDateFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}
