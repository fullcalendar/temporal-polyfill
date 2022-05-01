import { Temporal } from 'temporal-spec'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { zeroISOTimeFields } from '../dateUtils/dayAndTime'
import { isoFieldsToEpochMilli } from '../dateUtils/epoch'
import { createDateTime } from '../public/plainDateTime'
import { TimeZone } from '../public/timeZone'
import { OrigDateTimeFormat } from './intlUtils'

// factory types

export interface BaseEntity {
  calendar?: Temporal.CalendarProtocol
  timeZone?: Temporal.TimeZoneProtocol
}

export interface FormatFactory<Entity extends BaseEntity> {
  buildKey: KeyFactory<Entity>
  buildFormat: (calendarID: string, timeZoneID: string) => Intl.DateTimeFormat
  buildEpochMilli: (entity: Entity) => number
}

export type FormatFactoryFactory<Entity extends BaseEntity> = (
  locales: string[],
  options: Intl.DateTimeFormatOptions,
) => FormatFactory<Entity>

// zoned format factory

interface ZonedEntity extends BaseEntity {
  epochMilliseconds: number
}

export function createZonedFormatFactoryFactory<Entity extends ZonedEntity>(
  greedyDefaults: Intl.DateTimeFormatOptions,
  nonGreedyDefaults: Intl.DateTimeFormatOptions,
  finalOptions: Intl.DateTimeFormatOptions,
): FormatFactoryFactory<Entity> {
  return (locales: string[], options: Intl.DateTimeFormatOptions): FormatFactory<Entity> => {
    const defaults = anyDefaultsOverridden(greedyDefaults, options)
      ? {}
      : { ...greedyDefaults, ...nonGreedyDefaults }

    function buildFormat(calendarID: string, timeZoneID: string): Intl.DateTimeFormat {
      return new OrigDateTimeFormat(locales, {
        calendar: calendarID,
        timeZone: timeZoneID || undefined, // empty string should mean current timezone
        ...defaults,
        ...options,
        ...finalOptions,
      })
    }

    return {
      buildKey: createKeyFactory(locales, options, false),
      buildFormat,
      buildEpochMilli: getEpochMilliFromZonedEntity,
    }
  }
}

function getEpochMilliFromZonedEntity(entity: ZonedEntity): number {
  return entity.epochMilliseconds
}

// plain format factory

interface PlainEntity extends BaseEntity {
  getISOFields: () => Temporal.PlainDateISOFields // might have time fields too
}

export function createPlainFormatFactoryFactory<Entity extends PlainEntity>(
  greedyDefaults: Intl.DateTimeFormatOptions,
  finalOptions: Intl.DateTimeFormatOptions,
  strictCalendar?: boolean,
): FormatFactoryFactory<Entity> {
  return (locales: string[], options: Intl.DateTimeFormatOptions): FormatFactory<Entity> => {
    const defaults = anyDefaultsOverridden(greedyDefaults, options) ? {} : greedyDefaults

    function buildFormat(calendarID: string, timeZoneID: string) {
      return new OrigDateTimeFormat(locales, {
        calendar: calendarID,
        ...defaults,
        ...options,
        ...finalOptions,
        timeZone: timeZoneID, // guaranteed to be defined because of above 'UTC'
        timeZoneName: undefined, // never show timeZone name
      })
    }

    // TODO: investigate if Intl.DateTimeFormat allows passing in an object/protocol `TimeZone`
    // value. If so, we shouldn't call `new TimeZone`, but instead ensureTimeZoneProtocol

    return {
      buildKey: createKeyFactory(locales, options, strictCalendar),
      buildFormat,
      buildEpochMilli: options.timeZone !== undefined
        ? computeEpochMilliViaTimeZone.bind(null, new TimeZone(options.timeZone))
        : computeEpochMilliViaISO,
    }
  }
}

function computeEpochMilliViaTimeZone(timeZone: TimeZone, entity: PlainEntity): number {
  const plainDateTime = createDateTime({ // necessary? pass directly into getInstantFor?
    ...zeroISOTimeFields,
    ...entity.getISOFields(),
  })
  return timeZone.getInstantFor(plainDateTime).epochMilliseconds
}

function computeEpochMilliViaISO(entity: PlainEntity): number {
  return isoFieldsToEpochMilli(entity.getISOFields())
}

// cached format factory

export type CachedFormatFactory<Entity extends BaseEntity> = {
  buildFormat: (entity: Entity, otherEntity?: Entity) => Intl.DateTimeFormat
  buildEpochMilli: (entity: Entity) => number
}

export function buildCachedFormatFactory<Entity extends BaseEntity>(
  formatFactory: FormatFactory<Entity>,
): CachedFormatFactory<Entity> {
  const cachedFormats: { [key: string]: Intl.DateTimeFormat } = {}

  function buildFormat(entity: Entity, otherEntity?: Entity): Intl.DateTimeFormat {
    const keys = formatFactory.buildKey(entity, otherEntity)
    const key = keys.join('|')

    return cachedFormats[key] ||
      (cachedFormats[key] = formatFactory.buildFormat(...keys))
  }

  return {
    buildFormat,
    buildEpochMilli: formatFactory.buildEpochMilli,
  }
}

// keys

export type KeyFactory<Entity extends BaseEntity> = (
  entity: Entity,
  otherEntity?: Entity
) => [string, string] // [calendarID, timeZoneID]

function createKeyFactory<Entity extends BaseEntity>(
  locales: string[],
  options: Intl.DateTimeFormatOptions,
  strictCalendar: boolean | undefined,
): KeyFactory<Entity> {
  const optionsCalendarID = options.calendar ?? extractUnicodeCalendar(locales)
  const optionsTimeZoneID = options.timeZone

  return function(entity: Entity, otherEntity?: Entity): [string, string] {
    const entityCalendarID = entity.calendar?.id
    const entityTimeZoneID = entity.timeZone?.id

    if (otherEntity) {
      // TODO: use ensureCalendarsEqual somehow?
      if (otherEntity.calendar?.id !== entityCalendarID) {
        throw new RangeError('Mismatching calendar')
      }
      if (otherEntity.timeZone?.id !== entityTimeZoneID) {
        throw new RangeError('Mismatching timeZone')
      }
    }

    if (
      (strictCalendar || entityCalendarID !== isoCalendarID) &&
      entityCalendarID !== undefined &&
      optionsCalendarID !== undefined &&
      optionsCalendarID !== entityCalendarID
    ) {
      throw new RangeError('Non-iso calendar mismatch')
    }

    if (
      entityTimeZoneID !== undefined &&
      optionsTimeZoneID !== undefined &&
      optionsTimeZoneID !== entityTimeZoneID
    ) {
      throw new RangeError('Given timeZone must agree')
    }

    const calendarID = optionsCalendarID || entityCalendarID || isoCalendarID
    const timeZoneID = optionsTimeZoneID || entityTimeZoneID || 'UTC'

    return [calendarID, timeZoneID]
  }
}

function extractUnicodeCalendar(locales: string[]): string | undefined {
  for (const locale of locales) {
    const m = locale.match(/-u-ca-(.*)$/)
    if (m) {
      return m[1]
    }
  }

  return undefined
}

// general utils
// TODO: move elsewhere?

function anyDefaultsOverridden(defaults: any, overrides: any): boolean {
  for (const propName in defaults) {
    if (overrides[propName] !== undefined) {
      return true
    }
  }
  return false
}
