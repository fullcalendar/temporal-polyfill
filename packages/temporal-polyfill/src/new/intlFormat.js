import { isoCalendarId } from './calendarConfig'
import { dateBasicNames, timeFieldDefaults } from './calendarFields'
import { getInternals, getTemporalName } from './class'
import { epochNanoToMilli, isoEpochOriginYear } from './isoMath'
import { getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'
import {
  createLazyMap,
  excludePropsByName,
  hasAnyPropsByName,
  identityFunc,
  mapPropNamesToConstant,
} from './utils'

export const standardCalendarId = 'en-GB' // gives 24-hour clock

export function hashIntlFormatParts(intlFormat, epochMilliseconds) {
  const parts = intlFormat.formatToParts(epochMilliseconds)
  const hash = {}

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
  format(arg) {
    const [formattable, format] = resolveSingleFormattable(this, arg)
    return format
      ? format.format(formattable)
      : super.format(formattable)
      // can't use the origMethd.call trick because .format() is always bound
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
  }

  formatToParts(arg) {
    const [formattable, format] = resolveSingleFormattable(this, arg)
    return format
      ? format.formatToParts(formattable)
      : super.formatToParts(formattable)
  }
}

['formatRange', 'formatRangeToParts'].forEach((methodName) => {
  const origMethod = IntlDateTimeFormat.prototype[methodName]

  if (origMethod) {
    // TODO: not sufficient for defining method
    DateTimeFormat.prototype[methodName] = function(arg0, arg1) {
      const [formattable0, formattable1, format] = resolveRangeFormattables(this, arg0, arg1)
      return origMethod.call(format, formattable0, formattable1)
    }
  }
})

// DateTimeFormat Helpers
// -------------------------------------------------------------------------------------------------

const getGetSpecificFormat = createLazyMap(() => createLazyMap(createSpecificFormat), WeakMap)

function createSpecificFormat(transformOptions, resolvedOptions) {
  return new IntlDateTimeFormat(resolvedOptions.locale, transformOptions(resolvedOptions))
}

function resolveSingleFormattable(format, arg) {
  const getSpecificFormat = getGetSpecificFormat(format)
  const resolvedOptions = format.resolvedOptions()

  // returned format might be undefined
  return resolveFormattable(arg, getSpecificFormat, resolvedOptions)
}

function resolveRangeFormattables(format, arg0, arg1) {
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
  internals, // for ZonedDateTime
  locales,
  options, // NOT resolved yet (does not include locale)
) {
  options = { ...options }

  if (options.timeZone !== undefined) {
    throw new TypeError('ZonedDateTime toLocaleString does not accept a timeZone option')
  }
  options.timeZone = internals.timeZone.id

  if (
    options.timeZoneName === undefined &&
    !hasAnyPropsByName(options, dateTimeOptionNames)
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

function resolveFormattable(
  arg,
  getSpecificFormat,
  resolvedOptions,
) {
  const temporalName = getTemporalName(arg)
  const transformOptions = optionTransformers[temporalName]

  if (transformOptions) {
    const internalsToEpochNano = epochNanoConverters[temporalName] || dateTimeInternalsToEpochNano
    const epochNano = internalsToEpochNano(getInternals(arg), resolvedOptions, temporalName)

    return [
      epochNanoToMilli(epochNano),
      getSpecificFormat(transformOptions, resolvedOptions),
    ]
  }

  return [arg]
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

const optionTransformers = {
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

function createTransformer(optionNames, basicNames, exclusionNames) {
  const defaults = mapPropNamesToConstant(basicNames, 'numeric')
  const exclusionNamesSet = new Set(exclusionNames)

  return (options) => {
    options = excludePropsByName(options, exclusionNamesSet)

    if (!hasAnyPropsByName(options, optionNames)) {
      Object.assign(options, defaults)
    }

    return options
  }
}

// Epoch Conversions
// -------------------------------------------------------------------------------------------------

const epochNanoConverters = {
  Instant: identityFunc,
  PlainTime: timeInternalsToEpochNano,
  // otherwise, use dateTimeInternalsToEpochNano
}

function timeInternalsToEpochNano(internals, resolvedOptions) {
  return getSingleInstantFor({
    isoYear: isoEpochOriginYear,
    isoMonth: 1,
    isoDay: 1,
    ...internals,
    timeZone: queryTimeZoneOps(resolvedOptions.timeZone),
  })
}

function dateTimeInternalsToEpochNano(internals, resolvedOptions, temporalName) {
  checkCalendarsCompatible(
    internals.calendar.id,
    resolvedOptions.calendar,
    strictCalendarCheck[temporalName],
  )

  return getSingleInstantFor({
    ...timeFieldDefaults,
    isoHour: 12, // will not dst-shift into prev/next day
    ...internals,
    timeZone: queryTimeZoneOps(resolvedOptions.timeZone),
  })
}

// Calendar Check
// -------------------------------------------------------------------------------------------------

const strictCalendarCheck = {
  PlainYearMonth: true,
  PlainMonthDay: true,
}

function checkCalendarsCompatible(calendarId, resolveCalendarId, strict) {
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
