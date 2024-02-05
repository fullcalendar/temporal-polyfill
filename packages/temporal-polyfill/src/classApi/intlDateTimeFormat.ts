import * as errorMessages from '../internal/errorMessages'
import {
  ClassFormatConfig,
  FormatPrepper,
  createFormatForPrep,
  createFormatPrepper,
  instantConfig,
  plainDateConfig,
  plainDateTimeConfig,
  plainMonthDayConfig,
  plainTimeConfig,
  plainYearMonthConfig,
  zonedDateTimeConfig,
} from '../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  OrigDateTimeFormat,
  OrigFormattable,
} from '../internal/intlFormatUtils'
import { BrandingSlots } from '../internal/slots'
import {
  Classlike,
  createLazyGenerator,
  createPropDescriptors,
  pluckProps,
} from '../internal/utils'
import { Instant } from './instant'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

type TemporalFormattable =
  | Instant
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainYearMonth
  | PlainMonthDay
  | PlainTime

export type Formattable = TemporalFormattable | OrigFormattable

const internalsMap = new WeakMap<DateTimeFormat, DateTimeFormatInternals>()

// Intl.DateTimeFormat
// -----------------------------------------------------------------------------

export class DateTimeFormat extends OrigDateTimeFormat {
  constructor(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
    super(locales, options)
    internalsMap.set(this, new DateTimeFormatInternals(this, options))
  }

  format(arg?: Formattable): string {
    const internals = internalsMap.get(this)!
    const [format, origFormattable] = internals.prepFormat(arg)

    // HACK for now
    if (format === this) {
      return super.format(arg)
    }

    return format.format(origFormattable)
  }

  formatToParts(arg?: Formattable): Intl.DateTimeFormatPart[] {
    const internals = internalsMap.get(this)!
    const [format, origFormattable] = internals.prepFormat(arg)

    // HACK for now
    if (format === this) {
      return super.formatToParts(arg)
    }

    return format.formatToParts(origFormattable)
  }
}

export interface DateTimeFormat {
  formatRange(arg0: Formattable, arg1: Formattable): string
  formatRangeToParts(
    arg0: Formattable,
    arg1: Formattable,
  ): Intl.DateTimeRangeFormatPart[]
}

for (const methodName of [
  'formatRange',
  'formatRangeToParts',
] as (keyof Intl.DateTimeFormat)[]) {
  const origMethod = (OrigDateTimeFormat as Classlike).prototype[methodName]

  if (origMethod) {
    Object.defineProperties(
      DateTimeFormat.prototype,
      createPropDescriptors({
        [methodName]: function (
          this: DateTimeFormat,
          arg0: Formattable,
          arg1: Formattable,
        ) {
          const internals = internalsMap.get(this)!
          const [format, origFormattable0, origFormattable1] =
            internals.prepFormat(arg0, arg1)

          // HACK for now
          if (format === this) {
            return origMethod.call(format, arg0, arg1)
          }

          return format[methodName](origFormattable0, origFormattable1)
        },
      }),
    )
  }
}

// Config
// -----------------------------------------------------------------------------

const classFormatConfigs: Record<string, ClassFormatConfig<any>> = {
  PlainYearMonth: plainYearMonthConfig,
  PlainMonthDay: plainMonthDayConfig,
  PlainDate: plainDateConfig,
  PlainDateTime: plainDateTimeConfig,
  PlainTime: plainTimeConfig,
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
}

// Internals
// -----------------------------------------------------------------------------

class DateTimeFormatInternals {
  coreLocale: string
  coreOptions: Intl.DateTimeFormatOptions

  queryFormatPrepperForBranding = createLazyGenerator(
    createFormatPrepperForBranding,
  )

  constructor(
    private coreFormat: Intl.DateTimeFormat,
    options: Intl.DateTimeFormatOptions = {},
  ) {
    const resolveOptions = coreFormat.resolvedOptions()
    this.coreLocale = resolveOptions.locale

    // Copy options so accessing doesn't cause side-effects
    // Must store recursively flattened options because given `options` could mutate in future
    // Algorithm: whitelist against resolved options
    this.coreOptions = pluckProps(
      Object.keys(options) as OptionNames,
      resolveOptions as Intl.DateTimeFormatOptions,
    )
  }

  prepFormat(
    ...formattables: Formattable[]
  ): [Intl.DateTimeFormat, ...OrigFormattable[]] {
    let branding: string | undefined

    const slotsList = formattables.map((formattable, i) => {
      const slots = getSlots(formattable)
      const slotsBranding = (slots || {}).branding

      if (i && branding && branding !== slotsBranding) {
        throw new TypeError(errorMessages.mismatchingFormatTypes)
      }

      branding = slotsBranding
      return slots
    })

    if (branding) {
      return this.queryFormatPrepperForBranding(branding)(
        this.coreLocale,
        this.coreOptions,
        ...(slotsList as BrandingSlots[]),
      )
    }

    return [this.coreFormat, ...formattables]
  }
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
    createLazyGenerator(createFormatForPrep),
  )
}

// Format Prepping for each class' toLocaleString
// (best place for this?)
// -----------------------------------------------------------------------------

export const prepPlainYearMonthFormat =
  createFormatPrepper(plainYearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(plainMonthDayConfig)
export const prepPlainDateFormat = createFormatPrepper(plainDateConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(plainDateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepper(plainTimeConfig)
export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedDateTimeConfig)
