import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
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
}

const RawDateTimeFormatClass =
  RawDateTimeFormat as unknown as RawDateTimeFormatClass

export function createNativeDateTimeFormatFactory<R>(
  getNative: (record: R) => any,
): (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<R> {
  class NativeDateTimeFormat extends RawDateTimeFormatClass {
    format(record: R): string {
      return super.format(getNative(record))
    }

    formatToParts(record: R): Intl.DateTimeFormatPart[] {
      return super.formatToParts(getNative(record))
    }

    formatRange(record0: R, record1: R): string {
      return super.formatRange(getNative(record0), getNative(record1))
    }

    formatRangeToParts(
      record0: R,
      record1: R,
    ): ReturnType<Intl.DateTimeFormat['formatRangeToParts']> {
      return super.formatRangeToParts(getNative(record0), getNative(record1))
    }
  }

  return (
    locales?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ): DateTimeFormatLike<R> =>
    new NativeDateTimeFormat(
      locales,
      options,
    ) as unknown as DateTimeFormatLike<R>
}
