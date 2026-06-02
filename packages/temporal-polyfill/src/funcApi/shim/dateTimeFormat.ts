import {
  ClassFormatConfig,
  createFormatForPrep,
  createFormatPrepper,
} from '../../internal/intlFormatPrep'
import {
  LocalesArg,
  OptionNames,
  RawDateTimeFormat,
} from '../../internal/intlFormatUtils'
import { memoize, pluckProps } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'

type RawDateTimeFormatClass = new (
  _locales?: LocalesArg,
  _options?: Intl.DateTimeFormatOptions,
) => {
  format(date?: any): string
  formatToParts(date?: any): Intl.DateTimeFormatPart[]
  formatRange(startDate: any, endDate: any): string
  formatRangeToParts(
    startDate: any,
    endDate: any,
  ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']>
  resolvedOptions(): Intl.ResolvedDateTimeFormatOptions
}

const RawDateTimeFormatClass =
  RawDateTimeFormat as unknown as RawDateTimeFormatClass

// Creates a DTF-like formatter for one func API Temporal type. Constructor
// options are observed once by the host Intl.DateTimeFormat, then copied from
// resolvedOptions so later format calls cannot observe caller option mutation.
export function createDateTimeFormatFactory<R, S>(
  config: ClassFormatConfig<S>,
  getSlots: (record: R) => S,
): (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<R> {
  class ShimDateTimeFormat extends RawDateTimeFormatClass {
    private readonly copiedOptions: Intl.DateTimeFormatOptions
    private readonly prepFormat = createFormatPrepper(
      config,
      // Func Format models Intl.DateTimeFormat formatting a Temporal value, so
      // each formatter owns reusable subformat state instead of toLocaleString.
      memoize(createFormatForPrep),
      /* fromDateTimeFormatInstance = */ true,
    )
    private readonly resolvedLocale: string

    constructor(
      locales?: LocalesArg,
      options: Intl.DateTimeFormatOptions = Object.create(null),
    ) {
      super(locales, options)

      const resolvedOptions = this.resolvedOptions()
      this.resolvedLocale = resolvedOptions.locale
      this.copiedOptions = pluckProps(
        Object.keys(options) as OptionNames,
        resolvedOptions as Intl.DateTimeFormatOptions,
      )
    }

    private prepOne(record: R) {
      return this.prepFormat(
        this.resolvedLocale,
        this.copiedOptions,
        getSlots(record),
      )
    }

    private prepRange(record0: R, record1: R) {
      return this.prepFormat(
        this.resolvedLocale,
        this.copiedOptions,
        getSlots(record0),
        getSlots(record1),
      )
    }

    format(record: R): string {
      const [format, epochMilli] = this.prepOne(record)
      return format.format(epochMilli)
    }

    formatToParts(record: R): Intl.DateTimeFormatPart[] {
      const [format, epochMilli] = this.prepOne(record)
      return format.formatToParts(epochMilli)
    }

    formatRange(record0: R, record1: R): string {
      const [format, epochMilli0, epochMilli1] = this.prepRange(
        record0,
        record1,
      )
      return format.formatRange(epochMilli0, epochMilli1!)
    }

    formatRangeToParts(
      record0: R,
      record1: R,
    ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
      const [format, epochMilli0, epochMilli1] = this.prepRange(
        record0,
        record1,
      )
      return format.formatRangeToParts(epochMilli0, epochMilli1!)
    }
  }

  return (
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ): DateTimeFormatLike<R> =>
    new ShimDateTimeFormat(locales, options) as unknown as DateTimeFormatLike<R>
}
