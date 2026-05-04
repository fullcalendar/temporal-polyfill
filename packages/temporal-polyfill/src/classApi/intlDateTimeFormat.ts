import * as errorMessages from '../internal/errorMessages'
import {
  FormatPrepper,
  createFormatForPrep,
  createFormatPrepper,
} from '../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  RawDateTimeFormat,
  RawFormattable,
} from '../internal/intlFormatUtils'
import { BrandingSlots } from '../internal/slots'
import { refineTimeZoneId } from '../internal/timeZoneId'
import {
  Classlike,
  createNameDescriptors,
  memoize,
  pluckProps,
} from '../internal/utils'
import { Instant } from './instant'
import { classFormatConfigs } from './intlFormatConfig'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

export type TemporalFormattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime

export type Formattable = TemporalFormattable | RawFormattable

// Intl.DateTimeFormat
// -----------------------------------------------------------------------------

export type DateTimeFormat = Intl.DateTimeFormat
export const DateTimeFormat = createDateTimeFormatClass()

const internalsMap = new WeakMap<Intl.DateTimeFormat, DateTimeFormatInternals>()
const islamicCalendarFallbackIds = [
  'islamic-civil',
  'islamic-tbla',
  'islamic-umalqura',
] as const
const islamicFallbackProbeEpochMillis = [
  Date.UTC(2024, 0, 1),
  Date.UTC(2024, 5, 15),
  Date.UTC(2025, 2, 30),
]
const resolvedCalendarFallbackCache = new Map<string, string>()

function createDateTimeFormatClass(): typeof Intl.DateTimeFormat {
  // The Intl.DateTimeFormat object
  // More versatile because accommodates
  // `new Intl.DateTimeFormat()` and `Intl.DateTimeFormat()`
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#return_value
  function DateTimeFormatFunc(
    this: any,
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new (DateTimeFormatNew as Classlike)(locales, options)
  }

  // All calls to `new Intl.DateTimeFormat()` and `Intl.DateTimeFormat()` return
  // an instance of this class.
  function DateTimeFormatNew(
    this: any,
    locales: LocalesArg | undefined,
    options: Intl.DateTimeFormatOptions = Object.create(null), // protect against prototype pollution,
  ) {
    internalsMap.set(
      this as DateTimeFormat,
      createDateTimeFormatInternals(locales, options),
    )
  }

  const members = RawDateTimeFormat.prototype
  const memberDescriptors = Object.getOwnPropertyDescriptors(members)
  const classDescriptors = Object.getOwnPropertyDescriptors(RawDateTimeFormat)

  for (const memberName in memberDescriptors) {
    const memberDescriptor = memberDescriptors[memberName]
    const formatLikeMethod =
      memberName.startsWith('format') && createFormatMethod(memberName)
    const proxiedMethod =
      memberName === 'resolvedOptions'
        ? createResolvedOptionsMethod()
        : createProxiedMethod(memberName)

    if (typeof memberDescriptor.value === 'function') {
      memberDescriptor.value =
        memberName === 'constructor'
          ? DateTimeFormatFunc // expose more versatile
          : formatLikeMethod || proxiedMethod
    } else if (formatLikeMethod) {
      // .format() is always bound to the instance. It's a getter
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
      memberDescriptor.get = function (this: DateTimeFormat) {
        /*
        Protects against querying .format on non-DateTimeFormats AND
        fake DateTimeFormats via `Object.create(Intl.DateTimeFormat.prototype)`
        */
        if (!internalsMap.has(this)) {
          throw new TypeError(errorMessages.invalidCallingContext)
        }

        // don't do Function::bind, because gives weird .name
        return (...args: any[]) => formatLikeMethod.apply(this, args)
      }

      Object.defineProperties(
        memberDescriptor.get,
        createNameDescriptors(`get ${memberName}`),
      )
    }
  }

  // Both share prototype so they're both `instanceof` eachother
  classDescriptors.prototype.value = // eventually for DateTimeFormatFunc
    DateTimeFormatNew.prototype = Object.create({}, memberDescriptors)

  // Define static methods on the eventual Intl.DateTimeFormat
  Object.defineProperties(DateTimeFormatFunc, classDescriptors)

  return DateTimeFormatFunc as Classlike
}

function createFormatMethod(methodName: string) {
  const func = function (this: DateTimeFormat, ...formattables: Formattable[]) {
    const prepFormat = internalsMap.get(this)!
    const [format, ...rawFormattables] = prepFormat(
      methodName.includes('Range'), // HACK for deterining if range method
      ...formattables,
    )
    return (format as any)[methodName](...rawFormattables)
  }

  return Object.defineProperties(func, createNameDescriptors(methodName))
}

function createProxiedMethod(methodName: string) {
  const func = function (this: DateTimeFormat, ...args: any[]) {
    const prepFormat = internalsMap.get(this)!
    const res = (prepFormat.rawFormat as any)[methodName](...args)

    if (methodName === 'resolvedOptions' && prepFormat.timeZone) {
      // ECMA-402 now preserves the matched input time-zone identifier here.
      // Native Intl in older engines may still canonicalize links like
      // Australia/Canberra -> Australia/Sydney, so keep the validated public
      // identifier separately and repair only the user-visible options object.
      res.timeZone = prepFormat.timeZone
    }

    return res
  }

  return Object.defineProperties(func, createNameDescriptors(methodName))
}

function createResolvedOptionsMethod() {
  const func = function (this: DateTimeFormat) {
    const prepFormat = internalsMap.get(this)!
    const resolvedOptions = prepFormat.rawFormat.resolvedOptions()
    const calendar = normalizeResolvedCalendarId(resolvedOptions)
    const timeZone = prepFormat.timeZone || resolvedOptions.timeZone

    return calendar === resolvedOptions.calendar &&
      timeZone === resolvedOptions.timeZone
      ? resolvedOptions
      : { ...resolvedOptions, calendar, timeZone }
  }

  return Object.defineProperties(func, createNameDescriptors('resolvedOptions'))
}

// Internals
// -----------------------------------------------------------------------------

type DateTimeFormatInternalPrepper = (
  isRange: boolean,
  ...formattables: Formattable[]
) => [Intl.DateTimeFormat, ...RawFormattable[]]

type DateTimeFormatInternals = DateTimeFormatInternalPrepper & {
  rawFormat: Intl.DateTimeFormat

  // Only set for public Intl.DateTimeFormat wrapper instances that received a
  // timeZone option. Internal time-zone probes use RawDateTimeFormat directly,
  // because they need the host's canonical target for offset calculations.
  timeZone?: string
}

function createDateTimeFormatInternals(
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
): DateTimeFormatInternals {
  const rawFormat = new RawDateTimeFormat(locales, options)
  const resolveOptions = rawFormat.resolvedOptions()
  const timeZone = readOwnDataTimeZoneOption(options)
  const resolvedLocale = resolveOptions.locale

  // Copy original options in an unobservable way, using resolveOptions' data
  // Necessary because options will be reaccessed later when making brand-specific
  // formatters, and prop access can't be observable
  // NOTE: pluckProps protects against prototype pollution (only function that does!)
  // view Object.create(null)
  const copiedOptions = pluckProps(
    Object.keys(options) as OptionNames,
    resolveOptions as Intl.DateTimeFormatOptions,
  )

  const queryFormatPrepperForBranding = memoize(createFormatPrepperForBranding)

  /*
  TODO: this is overarchitected. done to accommodate format() and formatRange()
  */
  const prepFormat: DateTimeFormatInternalPrepper = (
    isRange: boolean, // HACK
    ...formattables: Formattable[]
  ) => {
    if (isRange) {
      if (formattables.length !== 2) {
        // TODO: better error messages about both args need defined
        throw new TypeError(errorMessages.mismatchingFormatTypes)
      }
      // check for any undefined arguments first
      for (const formattable of formattables) {
        if (formattable === undefined) {
          // TODO: better error messages about both args need defined
          throw new TypeError(errorMessages.mismatchingFormatTypes)
        }
      }
    }

    // HACK for .format(undefined), which should be same as .format()
    if (!isRange && formattables[0] === undefined) {
      formattables = []
    }

    const formattableEssences = formattables.map((formattable) => {
      return getSlots(formattable) || Number(formattable)
    })

    let overallBranding: string | undefined
    let i = 0

    for (const formattableEssence of formattableEssences) {
      const slotsBranding =
        typeof formattableEssence === 'object'
          ? formattableEssence.branding
          : undefined

      if (i++ && slotsBranding !== overallBranding) {
        throw new TypeError(errorMessages.mismatchingFormatTypes)
      }

      overallBranding = slotsBranding
    }

    if (overallBranding) {
      return queryFormatPrepperForBranding(overallBranding)(
        resolvedLocale,
        copiedOptions,
        ...(formattableEssences as BrandingSlots[]),
      )
    }

    return [rawFormat, ...(formattableEssences as number[])]
  }
  ;(prepFormat as DateTimeFormatInternals).rawFormat = rawFormat
  // Object.prototype can be tainted by Intl tests. Define the optional cache
  // slot directly so a polluted `timeZone` setter cannot observe construction.
  Object.defineProperty(prepFormat, 'timeZone', {
    value: timeZone,
    configurable: true,
    writable: true,
  })
  return prepFormat as DateTimeFormatInternals
}

function readOwnDataTimeZoneOption(
  options: Intl.DateTimeFormatOptions,
): string | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(options, 'timeZone')

  if (
    !descriptor ||
    !('value' in descriptor) ||
    descriptor.value === undefined
  ) {
    return undefined
  }

  // Native Intl has already performed the observable GetOption sequence. Reuse
  // only an own data-property value here; accessor options must not be invoked a
  // second time just so older engines can preserve the caller's exact zone ID in
  // resolvedOptions().
  return refineTimeZoneId(descriptor.value)
}

function createFormatPrepperForBranding<S extends BrandingSlots>(
  branding: S['branding'],
): FormatPrepper<S> {
  const config = classFormatConfigs[branding]
  if (!config) {
    throw new TypeError(errorMessages.invalidFormatType(branding))
  }

  return createFormatPrepper(
    config,
    // a generator that conveniently caches by the first arg: forcedTimeZoneId
    memoize(createFormatForPrep),
    /* strictOptions = */ true,
  )
}

function normalizeResolvedCalendarId(
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): string {
  const { calendar } = resolvedOptions

  if (calendar !== 'islamic' && calendar !== 'islamic-rgsa') {
    return calendar
  }

  const cacheKey = `${resolvedOptions.locale}\u0000${calendar}`
  let fallbackCalendar = resolvedCalendarFallbackCache.get(cacheKey)

  if (!fallbackCalendar) {
    fallbackCalendar = detectIslamicCalendarFallback(
      resolvedOptions.locale,
      calendar,
    )
    resolvedCalendarFallbackCache.set(cacheKey, fallbackCalendar)
  }

  return fallbackCalendar
}

function detectIslamicCalendarFallback(
  locale: string,
  calendarId: string,
): string {
  const expectedOutputs = computeCalendarProbeOutputs(locale, calendarId)

  for (let i = 0; i < islamicCalendarFallbackIds.length; i++) {
    const candidateCalendar = islamicCalendarFallbackIds[i]
    const candidateOutputs = computeCalendarProbeOutputs(
      locale,
      candidateCalendar,
    )
    let matches = true

    for (let j = 0; j < expectedOutputs.length; j++) {
      if (candidateOutputs[j] !== expectedOutputs[j]) {
        matches = false
        break
      }
    }

    if (matches) {
      return candidateCalendar
    }
  }

  return islamicCalendarFallbackIds[0]
}

function computeCalendarProbeOutputs(
  locale: string,
  calendarId: string,
): string[] {
  const format = new RawDateTimeFormat(locale, {
    calendar: calendarId,
    timeZone: 'UTC',
    era: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const outputs: string[] = []

  for (let i = 0; i < islamicFallbackProbeEpochMillis.length; i++) {
    outputs[i] = format.format(islamicFallbackProbeEpochMillis[i])
  }

  return outputs
}
