import { formatFactoryFactorySymbol } from '../dateUtils/abstract'
import { LocalesArg } from '../public/types'
import { BaseEntity, FormatFactoryFactory } from './intlFactory'
import { normalizeAndCopyLocalesArg } from './intlUtils'

export interface ToLocaleStringMethods {
  toLocaleString(localesArg?: LocalesArg, options?: Intl.DateTimeFormatOptions): string
}

export function mixinLocaleStringMethods<Entity extends (ToLocaleStringMethods & BaseEntity)>(
  ObjClass: { prototype: Entity },
  buildFormatFactory: FormatFactoryFactory<Entity>,
): void {
  ObjClass.prototype.toLocaleString = function(
    this: Entity,
    localesArg?: LocalesArg,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const formatFactory = buildFormatFactory(
      normalizeAndCopyLocalesArg(localesArg),
      options || {},
    )
    const [calendarID, timeZoneID] = formatFactory.buildKey(this)
    return formatFactory.buildFormat(calendarID, timeZoneID).format(
      formatFactory.buildEpochMilli(this),
    )
  }

  ;(ObjClass.prototype as any)[formatFactoryFactorySymbol] = buildFormatFactory
}

export function extractFormatFactoryFactory<Entity>(
  obj: any,
): FormatFactoryFactory<Entity> | undefined {
  return obj?.[formatFactoryFactorySymbol]
}
