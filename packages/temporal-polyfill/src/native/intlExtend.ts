import { CachedFormatFactory, FormatFactoryFactory, buildCachedFormatFactory } from './intlFactory'
import { extractFormatFactoryFactory } from './intlMixins'
import {
  DateTimeFormatArg,
  DateTimeFormatRangePart,
  LocalesArg,
  OrigDateTimeFormat,
  flattenOptions,
  normalizeAndCopyLocalesArg,
} from './intlUtils'

const origLocalesSymbol = Symbol()
const origOptionsSymbol = Symbol()
const factoryMapSymbol = Symbol()

/*
We can't monkeypatch Intl.DateTimeFormat because this auto-bound .format would be inaccessible
to our override method.
*/
export class ExtendedDateTimeFormat extends OrigDateTimeFormat {
  [origLocalesSymbol]: string[]
  [origOptionsSymbol]: Intl.DateTimeFormatOptions
  [factoryMapSymbol]: Map<FormatFactoryFactory<any>, CachedFormatFactory<any>>

  constructor(localesArg?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const normLocales = normalizeAndCopyLocalesArg(localesArg)
    const normOptions = flattenOptions(options || {}) // so that props aren't accessed again

    super(normLocales, normOptions)

    this[origLocalesSymbol] = normLocales
    this[origOptionsSymbol] = normOptions
    this[factoryMapSymbol] = new Map()
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
): [Intl.DateTimeFormat, DateTimeFormatArg | undefined] {
  const buildFormatFactory = extractFormatFactoryFactory(dateArg)

  if (buildFormatFactory) {
    const formatFactory = queryFormatFactoryForType(origDateTimeFormat, buildFormatFactory)
    return [
      formatFactory.buildFormat(dateArg),
      formatFactory.buildEpochMilli(dateArg),
    ]
  }

  return [origDateTimeFormat, dateArg]
}

function createRangeArgs(
  origDateTimeFormat: ExtendedDateTimeFormat,
  startArg: DateTimeFormatArg,
  endArg: DateTimeFormatArg,
): [Intl.DateTimeFormat, DateTimeFormatArg, DateTimeFormatArg] {
  const buildFormatFactory = extractFormatFactoryFactory(startArg)
  const buildFormatFactoryOther = extractFormatFactoryFactory(endArg)

  if (buildFormatFactory !== buildFormatFactoryOther) {
    throw new TypeError('Mismatch of types')
  }

  if (buildFormatFactory) {
    const formatFactory = queryFormatFactoryForType(origDateTimeFormat, buildFormatFactory)
    return [
      formatFactory.buildFormat(startArg, endArg),
      formatFactory.buildEpochMilli(startArg),
      formatFactory.buildEpochMilli(endArg),
    ]
  }

  return [origDateTimeFormat, startArg, endArg]
}

function queryFormatFactoryForType<Entity>(
  origDateTimeFormat: ExtendedDateTimeFormat,
  buildFormatFactory: FormatFactoryFactory<Entity>,
): CachedFormatFactory<Entity> {
  const formatFactoryMap = origDateTimeFormat[factoryMapSymbol]
  let formatFactory = formatFactoryMap.get(buildFormatFactory)

  if (!formatFactory) {
    formatFactory = buildCachedFormatFactory(
      buildFormatFactory(
        origDateTimeFormat[origLocalesSymbol],
        origDateTimeFormat[origOptionsSymbol],
      ),
    )
    formatFactoryMap.set(buildFormatFactory, formatFactory)
  }

  return formatFactory
}
