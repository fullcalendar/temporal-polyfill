import { LocalesArg } from '../public/types'
import { extractFormatFactoryFactory } from './intlMixins'
import {
  DateTimeFormatArg,
  DateTimeFormatRangePart,
  OrigDateTimeFormat,
  flattenOptions,
  normalizeAndCopyLocalesArg,
} from './intlUtils'

const origLocalesSymbol = Symbol()
const origOptionsSymbol = Symbol()

export class ExtendedDateTimeFormat extends OrigDateTimeFormat {
  [origLocalesSymbol]: string[]
  [origOptionsSymbol]: Intl.DateTimeFormatOptions

  constructor(localesArg?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const normLocales = normalizeAndCopyLocalesArg(localesArg)
    const normOptions = flattenOptions(options || {}) // so that props aren't accessed again

    super(normLocales, normOptions)

    this[origLocalesSymbol] = normLocales
    this[origOptionsSymbol] = normOptions
  }

  format(dateArg?: DateTimeFormatArg): string {
    const parts = createSingleArgs(this, dateArg)

    // HACK to overcome .format being unboundable
    // See NOTE here: https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    if (parts[0] === this) {
      return super.format(dateArg)
    }

    return parts[0].format(parts[1])
  }

  formatToParts(dateArg?: DateTimeFormatArg): Intl.DateTimeFormatPart[] {
    return super.formatToParts.call(...createSingleArgs(this, dateArg))
  }

  formatRange(startArg: DateTimeFormatArg, endArg: DateTimeFormatArg): string {
    return super.formatRange.call(...createRangeArgs(this, startArg, endArg))
  }

  formatRangeToParts(
    startArg: DateTimeFormatArg,
    endArg: DateTimeFormatArg,
  ): DateTimeFormatRangePart[] {
    return super.formatRangeToParts.call(...createRangeArgs(this, startArg, endArg))
  }
}

function createSingleArgs(
  origDateTimeFormat: ExtendedDateTimeFormat,
  dateArg: DateTimeFormatArg | undefined,
): [ Intl.DateTimeFormat, DateTimeFormatArg | undefined ] {
  const buildFormatFactory = extractFormatFactoryFactory(dateArg)

  if (buildFormatFactory) {
    const formatFactory = buildFormatFactory(
      origDateTimeFormat[origLocalesSymbol],
      origDateTimeFormat[origOptionsSymbol],
    )
    const [calendarID, timeZoneID] = formatFactory.buildKey(dateArg)
    return [
      formatFactory.buildFormat(calendarID, timeZoneID),
      formatFactory.buildEpochMilli(dateArg),
    ]
  }

  return [origDateTimeFormat, dateArg]
}

function createRangeArgs(
  origDateTimeFormat: ExtendedDateTimeFormat,
  startArg: DateTimeFormatArg,
  endArg: DateTimeFormatArg,
): [ Intl.DateTimeFormat, DateTimeFormatArg, DateTimeFormatArg ] {
  const buildFormatFactory = extractFormatFactoryFactory(startArg)
  const buildFormatFactoryOther = extractFormatFactoryFactory(endArg)

  if (buildFormatFactory !== buildFormatFactoryOther) {
    throw new TypeError('Mismatch of types')
  }

  if (buildFormatFactory) {
    const formatFactory = buildFormatFactory(
      origDateTimeFormat[origLocalesSymbol],
      origDateTimeFormat[origOptionsSymbol],
    )
    const [calendarID, timeZoneID] = formatFactory.buildKey(startArg, endArg)
    return [
      formatFactory.buildFormat(calendarID, timeZoneID),
      formatFactory.buildEpochMilli(startArg),
      formatFactory.buildEpochMilli(endArg),
    ]
  }

  return [origDateTimeFormat, startArg, endArg]
}
