import { Intl as IntlSpec } from 'temporal-spec'
import { CachedFormatFactory, FormatFactoryFactory, buildCachedFormatFactory } from './intlFactory'
import { extractFormatFactoryFactory } from './intlMixins'
import { LocalesArg, flattenOptions, normalizeAndCopyLocalesArg } from './intlUtils'

type DateArg = IntlSpec.Formattable | number

const origLocalesSymbol = Symbol()
const origOptionsSymbol = Symbol()
const factoryMapSymbol = Symbol()

/*
We can't monkeypatch Intl.DateTimeFormat because this auto-bound .format would be inaccessible
to our override method.

TODO: accept timeZone and calendar OBJECTS in options
*/
interface _DateTimeFormat {
  [origLocalesSymbol]: string[]
  [origOptionsSymbol]: Intl.DateTimeFormatOptions
  [factoryMapSymbol]: Map<FormatFactoryFactory<any>, CachedFormatFactory<any>>
}
class _DateTimeFormat extends Intl.DateTimeFormat {
  constructor(localesArg?: LocalesArg, options?: IntlSpec.DateTimeFormatOptions) {
    const normLocales = normalizeAndCopyLocalesArg(localesArg)
    const normOptions = flattenOptions(options || {}) // so that props aren't accessed again

    super(normLocales, normOptions)

    this[origLocalesSymbol] = normLocales
    this[origOptionsSymbol] = normOptions
    this[factoryMapSymbol] = new Map()
  }

  format(dateArg?: DateArg): string {
    const parts = createSingleArgs(this, dateArg)

    // HACK to overcome .format being bounded
    // See NOTE here: https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    if (parts[0] === this) {
      return super.format(parts[1])
    }

    return parts[0].format(parts[1])
  }

  formatToParts(dateArg?: DateArg): Intl.DateTimeFormatPart[] {
    return super.formatToParts.call(...createSingleArgs(this, dateArg))
  }

  formatRange<T extends IntlSpec.Formattable>(
    startArg: T,
    endArg: T,
  ): string {
    return super.formatRange.call(...createRangeArgs(this, startArg, endArg))
  }

  formatRangeToParts<T extends IntlSpec.Formattable>(
    startArg: T,
    endArg: T,
  ): IntlSpec.DateTimeFormatRangePart[] {
    return super.formatRangeToParts.call(
      ...createRangeArgs(this, startArg, endArg),
    ) as IntlSpec.DateTimeFormatRangePart[]
  }
}

// compliance with globalThis.Intl.DateTimeFormat
export const DateTimeFormat = _DateTimeFormat as ((typeof _DateTimeFormat) & {
  // constructor without `new`. this comes for free
  (locales?: string | string[], options?: IntlSpec.DateTimeFormatOptions): _DateTimeFormat;

  // retrofitted to accept better DateTimeFormatOptions
  // TODO: implement this!?
  supportedLocalesOf(
    locales: string | string[],
    options?: IntlSpec.DateTimeFormatOptions
  ): string[];
})

function createSingleArgs(
  origDateTimeFormat: _DateTimeFormat,
  dateArg: DateArg | undefined,
): [Intl.DateTimeFormat, Date | number | undefined] {
  const buildFormatFactory = extractFormatFactoryFactory(dateArg)

  if (buildFormatFactory) {
    const formatFactory = queryFormatFactoryForType(origDateTimeFormat, buildFormatFactory)
    return [
      formatFactory.buildFormat(dateArg),
      formatFactory.buildEpochMilli(dateArg),
    ]
  }

  return [origDateTimeFormat, dateArg as (Date | undefined)]
}

function createRangeArgs(
  origDateTimeFormat: _DateTimeFormat,
  startArg: IntlSpec.Formattable,
  endArg: IntlSpec.Formattable,
): [Intl.DateTimeFormat, Date, Date] {
  const buildFormatFactory = extractFormatFactoryFactory(startArg)
  const buildFormatFactoryOther = extractFormatFactoryFactory(endArg)

  if (buildFormatFactory !== buildFormatFactoryOther) {
    throw new TypeError('Mismatch of types')
  }

  if (buildFormatFactory) {
    const formatFactory = queryFormatFactoryForType(origDateTimeFormat, buildFormatFactory)
    return [
      formatFactory.buildFormat(startArg, endArg),
      new Date(formatFactory.buildEpochMilli(startArg)), // TODO: sure it needs to be Date?
      new Date(formatFactory.buildEpochMilli(endArg)), // "
    ]
  }

  return [origDateTimeFormat, startArg as Date, endArg as Date]
}

function queryFormatFactoryForType<Entity>(
  origDateTimeFormat: _DateTimeFormat,
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
