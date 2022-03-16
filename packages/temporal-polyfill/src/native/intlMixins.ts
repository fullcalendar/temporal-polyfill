import { formatConfigBuilderSymbol } from '../dateUtils/abstract'
import { LocalesArg } from '../public/types'
import { FormatConfigBuilder } from './intlFactory'
import { normalizeAndCopyLocalesArg } from './intlUtils'

export interface ToLocaleStringMethods {
  toLocaleString(localesArg?: LocalesArg, options?: Intl.DateTimeFormatOptions): string
}

export function mixinLocaleStringMethods<Entity extends ToLocaleStringMethods>(
  ObjClass: { prototype: Entity },
  buildFormatConfig: FormatConfigBuilder<Entity>,
): void {
  ObjClass.prototype.toLocaleString = function(
    this: Entity,
    localesArg?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const formatConfig = buildFormatConfig(
      normalizeAndCopyLocalesArg(localesArg),
      options || {},
    )
    const [calendarID, timeZoneID] = formatConfig.buildKey(this)
    return formatConfig.buildFormat(calendarID, timeZoneID).format(
      formatConfig.buildEpochMilli(this),
    )
  }

  ;(ObjClass.prototype as any)[formatConfigBuilderSymbol] = buildFormatConfig
}

// TODO: rename to 'extract'
export function getFormatConfigBuilder<Entity>(obj: any): FormatConfigBuilder<Entity> | undefined {
  return obj?.[formatConfigBuilderSymbol]
}
