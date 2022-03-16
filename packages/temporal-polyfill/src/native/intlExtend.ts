import { isObjectLike } from '../argParse/refine'
import { LocalesArg } from '../public/types'
import { getFormatConfigBuilder } from './intlMixins'
import {
  DateTimeFormatArg,
  DateTimeFormatRangePart,
  OrigDateTimeFormat,
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
    const parts = makeOne(this, dateArg)

    // HACK to overcome .format being unboundable
    // See NOTE here: https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    if (parts[0] === this) {
      return super.format(dateArg)
    }

    return parts[0].format(parts[1])
  }

  formatToParts(dateArg?: DateTimeFormatArg): Intl.DateTimeFormatPart[] {
    return super.formatToParts.call(...makeOne(this, dateArg))
  }

  formatRange(startArg: DateTimeFormatArg, endArg: DateTimeFormatArg): string {
    return super.formatRange.call(...makeTwo(this, startArg, endArg))
  }

  formatRangeToParts(
    startArg: DateTimeFormatArg,
    endArg: DateTimeFormatArg,
  ): DateTimeFormatRangePart[] {
    return super.formatRangeToParts.call(...makeTwo(this, startArg, endArg))
  }
}

function makeOne(
  origDateTimeFormat: ExtendedDateTimeFormat,
  dateArg: DateTimeFormatArg | undefined,
): [ Intl.DateTimeFormat, DateTimeFormatArg | undefined ] {
  const buildFormatConfig = getFormatConfigBuilder(dateArg)

  if (buildFormatConfig) {
    const formatConfig = buildFormatConfig( // TODO: cache formatConfig too?
      origDateTimeFormat[origLocalesSymbol],
      origDateTimeFormat[origOptionsSymbol],
    )
    const [calendarID, timeZoneID] = formatConfig.buildKey(dateArg)

    // TODO: leverage cache

    return [
      formatConfig.buildFormat(calendarID, timeZoneID),
      formatConfig.buildEpochMilli(dateArg),
    ]
  }

  return [origDateTimeFormat, dateArg]
}

function makeTwo(
  origDateTimeFormat: ExtendedDateTimeFormat,
  startArg: DateTimeFormatArg,
  endArg: DateTimeFormatArg,
): [ Intl.DateTimeFormat, DateTimeFormatArg, DateTimeFormatArg ] {
  const buildFormatConfig = getFormatConfigBuilder(startArg)
  const buildFormatConfigOther = getFormatConfigBuilder(endArg)

  if (buildFormatConfig !== buildFormatConfigOther) {
    throw new TypeError('Mismatch of types')
  }

  if (buildFormatConfig) {
    const formatConfig = buildFormatConfig(
      origDateTimeFormat[origLocalesSymbol],
      origDateTimeFormat[origOptionsSymbol],
    )
    const [calendarID, timeZoneID] = formatConfig.buildKey(startArg, endArg)

    // TODO: leverage cache

    return [
      formatConfig.buildFormat(calendarID, timeZoneID),
      formatConfig.buildEpochMilli(startArg),
      formatConfig.buildEpochMilli(endArg),
    ]
  }

  return [origDateTimeFormat, startArg, endArg]
}

// TODO: more efficient way to do this, mapping resolvedOptions
function flattenOptions(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
  const newOptions: Intl.DateTimeFormatOptions = {}

  for (const name in options) {
    let val = (options as any)[name]

    if (isObjectLike(val)) {
      val = val.toString()
    }

    (newOptions as any)[name] = val
  }

  return newOptions
}
