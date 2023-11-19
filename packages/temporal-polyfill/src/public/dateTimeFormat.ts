import { Classlike, createLazyGenerator, defineProps, pluckProps } from '../internal/utils'
import { OrigDateTimeFormat, LocalesArg, OptionNames, toEpochMilli, optionsTransformers } from '../internal/intlFormat'

// public
import type { ZonedDateTime } from './zonedDateTime'
import type { PlainDate } from './plainDate'
import type { PlainTime } from './plainTime'
import type { PlainDateTime } from './plainDateTime'
import type { PlainMonthDay } from './plainMonthDay'
import type { PlainYearMonth } from './plainYearMonth'
import type { Instant } from './instant'
import { BrandingSlots, getSlots } from './slots'
import { TimeZoneSlot, getTimeZoneSlotId } from './timeZoneSlot'

type OrigFormattable = number | Date
type TemporalFormattable = Instant |
  PlainDate |
  PlainDateTime |
  ZonedDateTime |
  PlainYearMonth |
  PlainMonthDay |
  PlainTime

export type Formattable = TemporalFormattable | OrigFormattable

type DateTimeFormatInternals = [
  SubformatFactory,
  Intl.ResolvedDateTimeFormatOptions
]

type SubformatFactory = (
  branding: string,
  timeZoneId?: string, // TODO: serialized too soon!!!... getTimeZoneSlotId(calendar)
) => Intl.DateTimeFormat | undefined

const formatInternalsMap = new WeakMap<Intl.DateTimeFormat, DateTimeFormatInternals>()

export class DateTimeFormat extends OrigDateTimeFormat {
  constructor(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
    super(locales, options)

    // Copy options so accessing doesn't cause side-effects
    // Must store recursively flattened options because given `options` could mutate in future
    // Algorithm: whitelist against resolved options
    const resolvedOptions = this.resolvedOptions()
    const { locale } = resolvedOptions
    options = pluckProps(
      Object.keys(options) as OptionNames,
      resolvedOptions as Intl.DateTimeFormatOptions
    )

    const subformatFactory = createLazyGenerator((
      branding: string,
      timeZoneId?: string, // TODO: serialized too soon!!!... getTimeZoneSlotId(calendar)
    ) => {
      if (optionsTransformers[branding]) {
        const transformedOptions = optionsTransformers[branding](options, timeZoneId)
        return new OrigDateTimeFormat(locale, transformedOptions)
      }
    })

    formatInternalsMap.set(this, [
      subformatFactory,
      resolvedOptions,
    ])
  }

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
      [methodName]: function (
        this: Intl.DateTimeFormat,
        arg0: Formattable,
        arg1: Formattable
      ) {
        const [formattable0, formattable1, format] = resolveRangeFormattables(this, arg0, arg1)
        return origMethod.call(format, formattable0, formattable1)
      }
    })
  }
})

// Arg-normalization Utils
// -------------------------------------------------------------------------------------------------

function resolveSingleFormattable(
  format: DateTimeFormat,
  arg: Formattable | undefined
): [
    OrigFormattable | undefined,
    Intl.DateTimeFormat | undefined // undefined if should use orig method
  ] {
  if (arg !== undefined) {
    return resolveFormattable(arg, ...formatInternalsMap.get(format)!)
  }

  // arg was not specified (current datetime)
  return [arg] as unknown as [OrigFormattable | undefined, undefined]
}

function resolveRangeFormattables(
  format: DateTimeFormat | Intl.DateTimeFormat,
  arg0: Formattable,
  arg1: Formattable
): [
    OrigFormattable,
    OrigFormattable,
    Intl.DateTimeFormat
  ] {
  const formatInternals = formatInternalsMap.get(format)!
  const [formattable0, format0] = resolveFormattable(arg0, ...formatInternals)
  const [formattable1, format1] = resolveFormattable(arg1, ...formatInternals)

  if (format0 || format1) {
    // the returned DateTimeFormats are idempotent per Temporal type,
    // so testing inequality is a way to test mismatching Temporal types.
    if (format0 !== format1) {
      throw new TypeError('Accepts two Temporal values of same type')
    }
    format = format0! // guaranteed to be truthy and equal
  }

  return [formattable0, formattable1, format]
}

function resolveFormattable(
  arg: Formattable,
  subformatFactory: SubformatFactory,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions
): [
    OrigFormattable,
    Intl.DateTimeFormat | undefined // undefined if should use orig method
  ] {
  const slots = getSlots(arg)
  const { branding, timeZone } = (slots || {}) as Partial<BrandingSlots & { timeZone: TimeZoneSlot }>
  const format = branding && subformatFactory(branding, timeZone ? getTimeZoneSlotId(timeZone) : undefined)

  if (format) {
    const epochMilli = toEpochMilli(branding, slots!, resolvedOptions)
    return [epochMilli, format]
  }

  // arg is an OrigFormattable
  return [arg] as unknown as [OrigFormattable, undefined]
}
