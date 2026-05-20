import { LocalesArg } from '../../internal/intlFormatUtils'
import { DateTimeFormatLike } from '../commonTypes'

export function createNativeDateTimeFormat<R>(
  getNative: (record: R) => any,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): DateTimeFormatLike<R> {
  const format = new Intl.DateTimeFormat(locales, options) as any

  return {
    format(record: R): string {
      return format.format(getNative(record))
    },

    formatToParts(record: R): Intl.DateTimeFormatPart[] {
      return format.formatToParts(getNative(record))
    },

    formatRange(record0: R, record1: R): string {
      return format.formatRange(getNative(record0), getNative(record1))
    },

    formatRangeToParts(
      record0: R,
      record1: R,
    ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
      return format.formatRangeToParts(getNative(record0), getNative(record1))
    },

    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
      return format.resolvedOptions()
    },
  }
}
