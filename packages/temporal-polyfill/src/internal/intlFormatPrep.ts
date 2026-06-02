import {
  type CalendarSlot,
  getCalendarSlotId,
  isoCalendar,
} from './calendarSlot'
import { isoDateTimeToEpochMilli, isoDateToEpochMilli } from './epochMath'
import * as errorMessages from './errorMessages'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { isoCalendarId } from './intlCalendarConfig'
import {
  type OptionsTransformer,
  transformDateOptions,
  transformDateTimeOptions,
  transformInstantOptions,
  transformMonthDayOptions,
  transformTimeOptions,
  transformYearMonthOptions,
  transformZonedOptions,
} from './intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from './intlFormatUtils'
import { EpochNanoFields, ZonedEpochNanoFields, getEpochMilli } from './slots'
import { timeFieldsToNano } from './timeFieldMath'
import { nanoInMilli } from './units'

/*
RULES:
DateTimeFormat always determines calendar and timeZone. If given date object conflicts, throw error.
However, for ZonedDateTimeFormat::toLocaleString, timeZone is forced by obj and can't be provided.
*/

// Config Utils
// -----------------------------------------------------------------------------

export type ClassFormatConfig<S> = {
  transformOptions: OptionsTransformer
  slotsToEpochMilli: EpochNanoConverter<S>

  // given slots (maybe 2 sets), intended to get timeZone and force into options
  getForcedTimeZoneId?: (...slotsList: S[]) => string

  // given slots (maybe 2 sets), if enabled, checks to make sure final resolvedOptions
  // not incompatible with slots
  strictCalendarChecks?: boolean
}

export type EpochNanoConverter<S> = (
  slots: S,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => number | undefined

// stable reference for caching
const emptyOptions: Intl.DateTimeFormatOptions = {}

export type FormatPrepper<S> = (
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
  ...slotsList: S[]
) => [Intl.DateTimeFormat, ...number[]]

export type FormatQuerier = (
  forcedTimeZoneId: string | undefined,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer,
  allowPartialOverlap: boolean,
) => Intl.DateTimeFormat

export function createFormatPrepper<S>(
  config: ClassFormatConfig<S>,
  queryFormat: FormatQuerier = createFormatForPrep,
  // Allows DateTimeFormat-with-Temporal-input callers to reuse one formatter
  // across Temporal types with partially overlapping field sets.
  allowPartialOverlap = false,
): FormatPrepper<S> {
  const { transformOptions, getForcedTimeZoneId } = config

  return (locales, options = emptyOptions, ...slotsList: S[]) => {
    const subformat = queryFormat(
      getForcedTimeZoneId && getForcedTimeZoneId(...slotsList),
      locales,
      options,
      transformOptions,
      allowPartialOverlap,
    )

    const resolvedOptions = subformat.resolvedOptions()

    return [subformat, ...toEpochMillis(config, resolvedOptions, slotsList)]
  }
}

export function createFormatForPrep(
  forcedTimeZoneId: string | undefined, // data-dependent
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  transformOptions: OptionsTransformer,
  allowPartialOverlap: boolean,
): Intl.DateTimeFormat {
  options = transformOptions(options, allowPartialOverlap)

  if (forcedTimeZoneId) {
    if (options.timeZone !== undefined) {
      throw new TypeError(errorMessages.forbiddenFormatTimeZone)
    }
    options.timeZone = forcedTimeZoneId
  }

  return new RawDateTimeFormat(locales, options)
}

function getForcedCommonTimeZone(
  slots0?: ZonedEpochNanoFields, // actually needed
  slots1?: ZonedEpochNanoFields, // optional!
): string {
  const timeZone = slots0!.timeZone
  if (slots1 && slots1.timeZone.compareKey !== timeZone.compareKey) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }
  return timeZone.id
}

// Config Data
// -----------------------------------------------------------------------------

/*
Detect bug where explicitly specifying calendar:iso8601 results in calendar:gregory
Happens in Node 14 and some version of V8 (Chrome version 80 at least)
https://github.com/nodejs/node/issues/42440
https://codepen.io/arshaw/pen/RNwVewm?editors=0010

If buggy, relax strictCalendarChecks for PlainYearMonth/PlainMonthDay
Much more elegant that intercepting `calendar` in the options, which
requires reading all props with a whitelist to ensure proper call order,
not to mention parsing locale strings like 'en-u-ca-iso8601'
Whitelists are fickle; won't adjust if new DateTimeFormat options added.

TODO: share this DateTimeFormat with computeCurrentTimeZoneId
*/
// HACK for pureTopLevel
function computeNonBuggyIsoResolve() {
  return (
    new RawDateTimeFormat(undefined, {
      calendar: isoCalendarId,
    }).resolvedOptions().calendar === isoCalendarId
  )
}
const nonBuggyIsoResolve = computeNonBuggyIsoResolve()

export const instantConfig: ClassFormatConfig<EpochNanoFields> = {
  transformOptions: transformInstantOptions,
  slotsToEpochMilli: getEpochMilli,
}

export const zonedConfig: ClassFormatConfig<ZonedEpochNanoFields> = {
  transformOptions: transformZonedOptions,
  slotsToEpochMilli: getEpochMilli,
  getForcedTimeZoneId: getForcedCommonTimeZone,
}

function formatTimeToEpochMilli(fields: TimeFields): number {
  return timeFieldsToNano(fields) / nanoInMilli
}

export const dateTimeConfig: ClassFormatConfig<CalendarDateTimeFields> = {
  transformOptions: transformDateTimeOptions,
  slotsToEpochMilli: isoDateTimeToEpochMilli,
}

export const dateConfig: ClassFormatConfig<CalendarDateFields> = {
  transformOptions: transformDateOptions,
  slotsToEpochMilli: isoDateToEpochMilli,
}

export const timeConfig: ClassFormatConfig<TimeFields> = {
  transformOptions: transformTimeOptions,
  slotsToEpochMilli: formatTimeToEpochMilli,
}

export const yearMonthConfig: ClassFormatConfig<CalendarDateFields> = {
  transformOptions: transformYearMonthOptions,
  slotsToEpochMilli: isoDateToEpochMilli,
  strictCalendarChecks: nonBuggyIsoResolve,
}

export const monthDayConfig: ClassFormatConfig<CalendarDateFields> = {
  transformOptions: transformMonthDayOptions,
  slotsToEpochMilli: isoDateToEpochMilli,
  strictCalendarChecks: nonBuggyIsoResolve,
}

// General Epoch Conversion
// -----------------------------------------------------------------------------

function toEpochMillis<S>(
  config: ClassFormatConfig<S>,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  slotsList: S[],
): number[] {
  const { slotsToEpochMilli, strictCalendarChecks } = config

  return slotsList.map((slots: S) => {
    const calendar = (slots as any).calendar
    if ('calendar' in (slots as any)) {
      checkCalendarsCompatible(
        calendar,
        resolvedOptions.calendar,
        strictCalendarChecks,
      )
    }

    // Formatting only passes already-valid Temporal slots here. The ISO epoch
    // helpers can return undefined for out-of-bounds plain data, but those
    // bounds have been enforced before a Temporal object reaches this point.
    return slotsToEpochMilli(slots, resolvedOptions)!
  })
}

function checkCalendarsCompatible(
  calendarSlot: CalendarSlot,
  resolvedCalendarId: string,
  strictCalendarCheck: boolean | undefined,
): void {
  if (
    (strictCalendarCheck || calendarSlot !== isoCalendar) &&
    getCalendarSlotId(calendarSlot) !== resolvedCalendarId
  ) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }
}
