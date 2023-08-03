import { isoCalendarId } from './calendarConfig'
import { dateBasicNames } from './calendarFields'
import { getInternals, getTemporalName } from './class'
import { Instant } from './instant'
import { IsoDateInternals, IsoDateTimeInternals, IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import { LargeInt } from './largeInt'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import {
  Classlike,
  Reused,
  createLazyGenerator,
  defineProps,
  excludePropsByName,
  hasAnyPropsByName,
  identityFunc,
  mapPropNamesToConstant,
} from './utils'
import { ZonedDateTime, ZonedInternals } from './zonedDateTime'

export type LocalesArg = string | string[]

export const standardLocaleId = 'en-GB' // gives 24-hour clock

export function hashIntlFormatParts(
  intlFormat: Intl.DateTimeFormat,
  epochMilliseconds: number,
): Record<string, string> {
  const parts = intlFormat.formatToParts(epochMilliseconds)
  const hash = {} as Record<string, string>

  for (const part of parts) {
    hash[part.type] = part.value
  }

  return hash
}

// Stuff
// -------------------------------------------------------------------------------------------------

export const OrigDateTimeFormat = Intl.DateTimeFormat

export class DateTimeFormat extends OrigDateTimeFormat {
  format(arg?: Formattable): string {
    const [formattable, format] = resolveSingleFormattable(this, arg)
    return format
      ? format.format(formattable)
      : super.format(formattable)
      // can't use the origMethd.call trick because .format() is always bound
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
  }

  formatToParts(arg?: Formattable): Intl.DateTimeFormatPart[] {
    const [formattable, format] = resolveSingleFormattable(this, arg)
    return format
      ? format.formatToParts(formattable)
      : super.formatToParts(formattable)
  }
}

export interface DateTimeFormat {
  formatRange(arg0: Formattable, arg1: Formattable): string
  formatRangeToParts(arg0: Formattable, arg1: Formattable): Intl.DateTimeFormatPart[]
}

['formatRange', 'formatRangeToParts'].forEach((methodName) => {
  const origMethod = (OrigDateTimeFormat as Classlike).prototype[methodName]

  if (origMethod) {
    defineProps(DateTimeFormat.prototype, {
      [methodName]: function(
        this: Intl.DateTimeFormat,
        arg0: Formattable,
        arg1: Formattable,
      ) {
        const [formattable0, formattable1, format] = resolveRangeFormattables(this, arg0, arg1)
        return origMethod.call(format, formattable0, formattable1)
      }
    })
  }
})

// DateTimeFormat Helpers
// -------------------------------------------------------------------------------------------------

/*
Returns a unique store for each original DateTimeFormat
*/
const getSpecificFormatStore = createLazyGenerator((origFormat: Intl.DateTimeFormat) => {
  return createLazyGenerator(createSpecificFormat)
}, WeakMap)

function createSpecificFormat(
  transformOptions: OptionsTransformer,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new OrigDateTimeFormat(resolvedOptions.locale, transformOptions(resolvedOptions))
}

function resolveSingleFormattable(
  origFormat: Intl.DateTimeFormat,
  arg: Formattable | undefined,
): [
  OrigFormattable | undefined,
  Intl.DateTimeFormat | undefined
] {
  if (arg === undefined) {
    return [arg, origFormat]
  }

  const specificFormatStore = getSpecificFormatStore(origFormat)
  const resolvedOptions = origFormat.resolvedOptions()

  return resolveFormattable(arg, specificFormatStore, resolvedOptions)
}

function resolveRangeFormattables(
  origFormat: Intl.DateTimeFormat,
  arg0: Formattable,
  arg1: Formattable,
): [
  OrigFormattable,
  OrigFormattable,
  Intl.DateTimeFormat,
] {
  const specificFormatStore = getSpecificFormatStore(origFormat)
  const resolvedOptions = origFormat.resolvedOptions()

  const [formattable0, format0] = resolveFormattable(arg0, specificFormatStore, resolvedOptions)
  const [formattable1, format1] = resolveFormattable(arg1, specificFormatStore, resolvedOptions)

  if (format0 && format1) {
    // the returned DateTimeFormats are idempotent per Temporal type,
    // so testing inequality is a way to test mismatching Temporal types.
    if (format0 !== format1) {
      throw new TypeError('Accepts two Temporal values of same type')
    }
    origFormat = format0 // reused
  }

  return [formattable0, formattable1, origFormat]
}

// Resolving Formattable Objects (and Format)
// -------------------------------------------------------------------------------------------------

/*
ZonedDateTime call this directly. Doesn't leverage our DateTimeFormat
*/
export function resolveZonedFormattable(
  internals: ZonedInternals,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions, // NOT resolved yet (does not include locale)
): [
  number,
  Intl.DateTimeFormat,
] {
  options = { ...options }

  if (options.timeZone !== undefined) {
    throw new TypeError('ZonedDateTime toLocaleString does not accept a timeZone option')
  }
  options.timeZone = internals.timeZone.id

  if (
    options.timeZoneName === undefined &&
    !hasAnyPropsByName(options as Record<string, string>, dateTimeOptionNames)
  ) {
    options.timeZoneName = 'short'
  }

  const origFormat = new OrigDateTimeFormat(locales, options)
  const resolvedOptions = origFormat.resolvedOptions()
  const transformedOptions = instantOptionsTransformer(resolvedOptions)
  const specificFormat = new OrigDateTimeFormat(resolvedOptions.locale, transformedOptions)
  const epochMilli = epochNanoToMilli(internals.epochNanoseconds)

  checkCalendarsCompatible(
    internals.calendar.id,
    resolvedOptions.calendar,
  )

  return [epochMilli, specificFormat]
}

type OrigFormattable = number | Date

export type Formattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime
  | OrigFormattable

type SpecificFormatStore = (
  optionsTransformer: OptionsTransformer, // a proxy for the Temporal type
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
) => Intl.DateTimeFormat

function resolveFormattable(
  arg: Formattable,
  specificFormatStore: SpecificFormatStore,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): [
  OrigFormattable,
  Intl.DateTimeFormat | undefined
] {
  const temporalName = getTemporalName(arg)
  const transformOptions = temporalName && optionTransformers[temporalName]

  if (transformOptions) {
    const internalsToEpochNano = epochNanoConverters[temporalName] || dateInternalsToEpochNano
    const epochNano = internalsToEpochNano(getInternals(arg), resolvedOptions, temporalName)
    const epochMilli = epochNanoToMilli(epochNano)
    const format = specificFormatStore(transformOptions, resolvedOptions)

    return [epochMilli, format]
  }

  return [arg as number] as unknown as
    [number, undefined]
}

// Format Option Massagers
// -------------------------------------------------------------------------------------------------

const timeBasicNames = ['hour', 'minute', 'second']
const dateTimeBasicNames = [...dateBasicNames, ...timeBasicNames]
const yearMonthBasicNames = ['year', 'month']
const monthDayBasicNames = ['month', 'day']

const dateOptionNames = [
  ...dateBasicNames,
  'weekday',
  'dateStyle',
]
const timeOptionNames = [
  ...timeBasicNames,
  'dayPeriod', // am/pm
  'timeStyle',
]
const dateTimeOptionNames = [
  ...dateOptionNames,
  ...timeOptionNames,
]

const dateTimeExclusions = ['timeZoneName']
const dateExclusions = [...dateTimeExclusions, ...timeOptionNames]
const timeExclusions = [...dateTimeExclusions, ...dateOptionNames]
const yearMonthExclusions = [
  ...dateTimeExclusions,
  'day',
  'weekday',
  'dateStyle',
  ...timeOptionNames,
]
const monthDayExclusions = [
  ...dateTimeExclusions,
  'year',
  'weekday',
  'dateStyle',
  ...timeOptionNames,
]

const instantOptionsTransformer = createTransformer(dateTimeOptionNames, dateTimeBasicNames, [])

const optionTransformers: Record<string, OptionsTransformer> = {
  PlainTime: createTransformer(timeOptionNames, timeBasicNames, timeExclusions),
  PlainDateTime: createTransformer(dateTimeOptionNames, dateTimeBasicNames, dateTimeExclusions),
  PlainDate: createTransformer(dateOptionNames, dateBasicNames, dateExclusions),
  PlainYearMonth: createTransformer(yearMonthBasicNames, yearMonthBasicNames, yearMonthExclusions),
  PlainMonthDay: createTransformer(monthDayBasicNames, monthDayBasicNames, monthDayExclusions),
  Instant: instantOptionsTransformer,
  ZonedDateTime: () => {
    throw new TypeError('Cant do on ZonedDateTime')
  },
}

type OptionsTransformer = (options: Intl.ResolvedDateTimeFormatOptions) => Intl.DateTimeFormatOptions

function createTransformer(
  validNames: string[],
  implicitNames: string[],
  excludedNames: string[],
): OptionsTransformer {
  const defaults = mapPropNamesToConstant(implicitNames, 'numeric')
  const excludedNameSet = new Set(excludedNames)

  return (
    options: Intl.ResolvedDateTimeFormatOptions | Reused
  ) => {
    options = excludePropsByName(options, excludedNameSet)

    if (!hasAnyPropsByName(options, validNames)) {
      Object.assign(options, defaults)
    }

    return options
  }
}

// Epoch Conversions
// -------------------------------------------------------------------------------------------------

type EpochNanoConverter = (
  internals: any,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  temporalName: string,
) => LargeInt

const epochNanoConverters: Record<string, EpochNanoConverter> = {
  Instant: identityFunc,
  PlainTime: timeFieldsToEpochNano,
  // otherwise, use dateInternalsToEpochNano
}

function timeFieldsToEpochNano(
  internals: IsoTimeFields,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): LargeInt {
  return getSingleInstantFor(
    queryTimeZoneOps(resolvedOptions.timeZone),
    {
      isoYear: isoEpochOriginYear,
      isoMonth: 1,
      isoDay: 1,
      ...internals,
    },
  )
}

function dateInternalsToEpochNano(
  internals: IsoDateTimeInternals | IsoDateInternals,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  temporalName: string,
): LargeInt {
  checkCalendarsCompatible(
    internals.calendar.id,
    resolvedOptions.calendar,
    strictCalendarCheck[temporalName],
  )

  return getSingleInstantFor(
    queryTimeZoneOps(resolvedOptions.timeZone),
    {
      ...isoTimeFieldDefaults,
      isoHour: 12, // for whole-day dates, will not dst-shift into prev/next day
      ...internals,
    },
  )
}

// Calendar Check
// -------------------------------------------------------------------------------------------------

const strictCalendarCheck: Record<string, boolean> = {
  PlainYearMonth: true,
  PlainMonthDay: true,
}

function checkCalendarsCompatible(
  internalCalendarId: string,
  resolveCalendarId: string,
  strict?: boolean,
): void {
  if (
    (!strict || internalCalendarId !== isoCalendarId) &&
    (internalCalendarId !== resolveCalendarId)
  ) {
    throw new RangeError('Mismatching calendars')
  }
}
