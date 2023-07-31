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
import { PlainYearMonth } from './plainYearMonth'
import { getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import {
  createLazyGenerator,
  excludePropsByName,
  hasAnyPropsByName,
  identityFunc,
  mapPropNamesToConstant,
} from './utils'
import { ZonedDateTime, ZonedInternals } from './zonedDateTime'

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

// AHHH... problem with resolvedOptions... need to whitelist original
// PERFORMANCE: avoid using our DateTimeFormat for toLocaleString, because creates two objects

export const IntlDateTimeFormat = Intl.DateTimeFormat

export class DateTimeFormat extends IntlDateTimeFormat {
  format(arg?: Formattable): string {
    const [formattable, format] = resolveSingleFormattable(this as Intl.DateTimeFormat, arg)
    return format
      ? format.format(formattable)
      : super.format(formattable)
      // can't use the origMethd.call trick because .format() is always bound
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
  }

  formatToParts(arg?: Formattable): Intl.DateTimeFormatPart[] {
    const [formattable, format] = resolveSingleFormattable(this as Intl.DateTimeFormat, arg)
    return format
      ? format.formatToParts(formattable)
      : super.formatToParts(formattable)
  }
}

['formatRange', 'formatRangeToParts'].forEach((methodName) => {
  const origMethod = (IntlDateTimeFormat as any).prototype[methodName]

  if (origMethod) {
    // TODO: not sufficient for defining method. Use defineProperty!
    (DateTimeFormat as any).prototype[methodName] = function(
      arg0: Formattable,
      arg1: Formattable,
    ) {
      const [formattable0, formattable1, format] = resolveRangeFormattables(this, arg0, arg1)
      return origMethod.call(format, formattable0, formattable1)
    }
  }
})

// DateTimeFormat Helpers
// -------------------------------------------------------------------------------------------------

const getGetSpecificFormat = createLazyGenerator((dtf: Intl.DateTimeFormat) => {
  return createLazyGenerator(createSpecificFormat)
}, WeakMap)

function createSpecificFormat(
  transformOptions: OptionsTransformer,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new IntlDateTimeFormat(resolvedOptions.locale, transformOptions(resolvedOptions))
}

function resolveSingleFormattable(
  format: Intl.DateTimeFormat,
  arg: Formattable | undefined,
): [
  OrigFormattable | undefined,
  Intl.DateTimeFormat | undefined
] {
  if (arg === undefined) {
    return [arg, format]
  }

  const getSpecificFormat = getGetSpecificFormat(format)
  const resolvedOptions = format.resolvedOptions()

  return resolveFormattable(arg, getSpecificFormat, resolvedOptions)
}

function resolveRangeFormattables(
  format: Intl.DateTimeFormat,
  arg0: Formattable,
  arg1: Formattable,
): [
  OrigFormattable,
  OrigFormattable,
  Intl.DateTimeFormat,
] {
  const getSpecificFormat = getGetSpecificFormat(format)
  const resolvedOptions = format.resolvedOptions()

  const [formattable0, format0] = resolveFormattable(arg0, getSpecificFormat, resolvedOptions)
  const [formattable1, format1] = resolveFormattable(arg1, getSpecificFormat, resolvedOptions)

  if (format0 && format1) {
    if (format0 !== format1) {
      throw new TypeError('Accepts two Temporal values of same type')
    }
    format = format0
  }

  // always returns a format
  return [formattable0, formattable1, format]
}

// Resolving Formattable Objects (and Format)
// -------------------------------------------------------------------------------------------------

export function resolveZonedFormattable(
  internals: ZonedInternals,
  locales?: string | string[],
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
    // The rest of the defaults will be filled in by formatting the Instant
    options.timeZoneName = 'short'
  }

  const format = new IntlDateTimeFormat(locales, options)

  checkCalendarsCompatible(
    internals.calendar.id,
    format.resolvedOptions().calendar,
  )

  return [
    epochNanoToMilli(internals.epochNanoseconds),
    format,
  ]
}

type OrigFormattable = number | Date
type Formattable = Instant | PlainDate | PlainDateTime | ZonedDateTime | PlainYearMonth | PlainMonthDay | OrigFormattable

function resolveFormattable(
  arg: Formattable,
  getSpecificFormat: (optionsTransformer: OptionsTransformer, resolvedOptions: Intl.ResolvedDateTimeFormatOptions) => Intl.DateTimeFormat,
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

    return [
      epochNanoToMilli(epochNano),
      getSpecificFormat(transformOptions, resolvedOptions),
    ]
  }

  return [arg as number] as
    unknown as [number, undefined]
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

const optionTransformers: Record<string, OptionsTransformer> = {
  PlainTime: createTransformer(timeOptionNames, timeBasicNames, timeExclusions),
  PlainDateTime: createTransformer(dateTimeOptionNames, dateTimeBasicNames, dateTimeExclusions),
  PlainDate: createTransformer(dateOptionNames, dateBasicNames, dateExclusions),
  PlainYearMonth: createTransformer(yearMonthBasicNames, yearMonthBasicNames, yearMonthExclusions),
  PlainMonthDay: createTransformer(monthDayBasicNames, monthDayBasicNames, monthDayExclusions),
  Instant: createTransformer(dateTimeOptionNames, dateTimeBasicNames, []),
  ZonedDateTime: () => {
    throw new TypeError('Cant do on ZonedDateTime')
  },
}

// TODO: use Intl.DateTimeFormatOptions?
type OptionsTransformer = (options: any) => any

function createTransformer(
  optionNames: string[],
  basicNames: string[],
  exclusionNames: string[],
): OptionsTransformer {
  const defaults = mapPropNamesToConstant(basicNames, 'numeric')
  const exclusionNamesSet = new Set(exclusionNames)

  return (options: any) => {
    options = excludePropsByName(options, exclusionNamesSet)

    if (!hasAnyPropsByName(options, optionNames)) {
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

// TODO: simply check for absense of 'Date' in name?
const strictCalendarCheck: Record<string, boolean> = {
  PlainYearMonth: true,
  PlainMonthDay: true,
}

function checkCalendarsCompatible(
  calendarId: string,
  resolveCalendarId: string,
  strict?: boolean,
): void {
  if (!(
    calendarId === resolveCalendarId ||
    (!strict && (
      calendarId === isoCalendarId ||
      resolveCalendarId === isoCalendarId
    ))
  )) {
    throw new RangeError('Mismatching calendars')
  }
}
