import {
  ClassFormatConfig,
  createFormatForPrep,
  createFormatPrepper,
} from '../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  RawDateTimeFormat,
} from '../internal/intlFormatUtils'
import { memoize, pluckProps } from '../internal/utils'

export interface DateTimeFormatLike<R> {
  format(record: R): string
  formatToParts(record: R): Intl.DateTimeFormatPart[]
  formatRange(record0: R, record1: R): string
  formatRangeToParts(
    record0: R,
    record1: R,
  ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']>
  resolvedOptions(): Intl.ResolvedDateTimeFormatOptions
}

// Creates a DTF-like formatter for one func API Temporal type. Constructor
// options are observed once by the host Intl.DateTimeFormat, then copied from
// resolvedOptions so later format calls cannot observe caller option mutation.
export function createDateTimeFormat<R, S>(
  config: ClassFormatConfig<S>,
  getSlots: (record: R) => S,
  locales?: LocalesArg,
  options: Intl.DateTimeFormatOptions = Object.create(null),
): DateTimeFormatLike<R> {
  const rawFormat = new RawDateTimeFormat(locales, options)
  const resolvedOptions = rawFormat.resolvedOptions()
  const copiedOptions = pluckProps(
    Object.keys(options) as OptionNames,
    resolvedOptions as Intl.DateTimeFormatOptions,
  )

  const prepFormat = createFormatPrepper(
    config,
    // Func Format models Intl.DateTimeFormat formatting a Temporal value, so
    // each formatter owns reusable subformat state instead of toLocaleString.
    memoize(createFormatForPrep),
    /* strictOptions = */ true,
  )

  function prepOne(record: R) {
    return prepFormat(resolvedOptions.locale, copiedOptions, getSlots(record))
  }

  function prepRange(record0: R, record1: R) {
    return prepFormat(
      resolvedOptions.locale,
      copiedOptions,
      getSlots(record0),
      getSlots(record1),
    )
  }

  return {
    format(record: R): string {
      const [format, epochMilli] = prepOne(record)
      return format.format(epochMilli)
    },

    formatToParts(record: R): Intl.DateTimeFormatPart[] {
      const [format, epochMilli] = prepOne(record)
      return format.formatToParts(epochMilli)
    },

    formatRange(record0: R, record1: R): string {
      const [format, epochMilli0, epochMilli1] = prepRange(record0, record1)
      return format.formatRange(epochMilli0, epochMilli1!)
    },

    formatRangeToParts(
      record0: R,
      record1: R,
    ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
      const [format, epochMilli0, epochMilli1] = prepRange(record0, record1)
      return format.formatRangeToParts(epochMilli0, epochMilli1!)
    },

    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
      return rawFormat.resolvedOptions()
    },
  }
}
