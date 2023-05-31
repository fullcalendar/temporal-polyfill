import { isoCalendarId } from './calendarConfig'
import { dateBasicNames, timeFieldDefaults } from './calendarFields'
import { isoEpochOriginYear } from './calendarImpl'
import { getInternals } from './internalClass'
import { identityFunc } from './lang'
import { epochNanoToMilli } from './nanoseconds'
import { getTemporalName } from './temporalClass'
import { getSingleInstantFor, queryTimeZoneOps } from './timeZoneOps'

export const IntlDateTimeFormat = Intl.DateTimeFormat

const getGetSpecificFormat = createLazyMap(() => createLazyMap(createSpecificFormat), WeakMap)

function createSpecificFormat(massageOptions, resolvedOptions) {
  return new IntlDateTimeFormat(resolvedOptions.locale, massageOptions(resolvedOptions))
}

// DateTimeFormat
// -------------------------------------------------------------------------------------------------

export class DateTimeFormat extends IntlDateTimeFormat {
  format(arg) {
    const [formattable, format] = resolveSingleFormattable(this, arg)
    return format
      ? format.format(formattable)
      : super.format(formattable)
      // must use super because .format is always bound:
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
    DateTimeFormat.prototype[methodName] = function(arg0, arg1) {
      const [formattable0, formattable1, format] = resolveRangeFormattables(this, arg0, arg1)
      return origMethod.call(format, formattable0, formattable1)
    }
  }
})

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
    !hasAnyMatchingProps(options, dateTimeOptionNames)
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
  const massageOptions = optionMassagers[temporalName]

  if (massageOptions) {
    const internalsToEpochNano = epochNanoConverters[temporalName] || dateTimeInternalsToEpochNano
    const epochNano = internalsToEpochNano(getInternals(arg), resolvedOptions, temporalName)

    return [
      epochNanoToMilli(epochNano),
      getSpecificFormat(massageOptions, resolvedOptions),
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

function createMassager(optionNames, basicNames, exclusionNames) {
  const defaults = propsWithSameValue(basicNames, 'numeric')

  return (options) => {
    options = excludeProps(options, exclusionNames)

    if (!hasAnyMatchingProps(options, optionNames)) {
      Object.assign(options, defaults)
    }

    return options
  }
}

const optionMassagers = {
  PlainTime: createMassager(timeOptionNames, timeBasicNames, timeExclusions),
  PlainDateTime: createMassager(dateTimeOptionNames, dateTimeBasicNames, dateTimeExclusions),
  PlainDate: createMassager(dateOptionNames, dateBasicNames, dateExclusions),
  PlainYearMonth: createMassager(yearMonthBasicNames, yearMonthBasicNames, yearMonthExclusions),
  PlainMonthDay: createMassager(monthDayBasicNames, monthDayBasicNames, monthDayExclusions),
  Instant: createMassager(dateTimeOptionNames, dateTimeBasicNames, []),
  ZonedDateTime: () => {
    throw new TypeError('Cant do on ZonedDateTime')
  },
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
    resolvedOptions.calendarId,
    strictCalendarCheck[temporalName],
  )

  return getSingleInstantFor({
    ...timeFieldDefaults,
    isoHour: 12,
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

// Utils
// -------------------------------------------------------------------------------------------------

function excludeProps(options, propNames) {
}

function hasAnyMatchingProps(props, propNames) {
}

function createLazyMap() {
}

function propsWithSameValue() {
}
