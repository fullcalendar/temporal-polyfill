import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { createDateTime } from '../dateUtils/dateTime'
import { isoFieldsToEpochMilli } from '../dateUtils/isoMath'
import { zeroTimeISOFields } from '../dateUtils/zonedDateTime'
import { Calendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { DateISOFields } from '../public/types'
import { OrigDateTimeFormat } from './intlUtils'

export type FormatConfigBuilder<Entity> = (
  locales: string[],
  options: Intl.DateTimeFormatOptions,
) => FormatConfig<Entity>

interface BaseEntity {
  calendar?: Calendar
  timeZone?: TimeZone
}

interface ZonedEntity extends BaseEntity {
  epochMilliseconds: number
}

interface PlainEntity extends BaseEntity {
  getISOFields: () => DateISOFields // might have time fields too
}

export interface FormatConfig<Entity> {
  buildKey: (entity: Entity, otherEntity?: Entity) => [string, string]
  buildFormat: (calendarID: string, timeZoneID: string) => Intl.DateTimeFormat
  buildEpochMilli: (entity: Entity) => number
}

export function buildZonedFormatConfig<Entity extends ZonedEntity>(
  locales: string[],
  options: Intl.DateTimeFormatOptions,
  nonGreedyDefaults: Intl.DateTimeFormatOptions,
  greedyDefaults: Intl.DateTimeFormatOptions,
  finalOptions: Intl.DateTimeFormatOptions,
): FormatConfig<Entity> {
  const buildKey = createKeyBuilder<Entity>(locales, options, false)

  function buildFormat(calendarID: string, timeZoneID: string): Intl.DateTimeFormat {
    let useDefaults = true

    for (const availableOptionName in greedyDefaults) {
      if ((options as any)[availableOptionName] !== undefined) {
        useDefaults = false
        break
      }
    }

    return new OrigDateTimeFormat(locales, {
      calendar: calendarID,
      timeZone: timeZoneID || undefined, // empty string should mean current timezone
      ...(useDefaults ? { ...nonGreedyDefaults, ...greedyDefaults } : {}),
      ...options,
      ...finalOptions,
    })
  }

  function buildEpochMilli(entity: Entity): number {
    return entity.epochMilliseconds
  }

  return {
    buildKey,
    buildFormat,
    buildEpochMilli,
  }
}

export function buildPlainFormatConfig<Entity extends PlainEntity>(
  locales: string[],
  options: Intl.DateTimeFormatOptions,
  availableOptions: Intl.DateTimeFormatOptions,
  finalOptions: Intl.DateTimeFormatOptions,
  strictCalendar?: boolean,
): FormatConfig<Entity> {
  const buildKey = createKeyBuilder(locales, options, strictCalendar)

  function buildFormat(calendarID: string, timeZoneID: string) {
    let anyOverrides = false

    for (const availableOptionName in availableOptions) {
      if ((options as any)[availableOptionName] !== undefined) {
        anyOverrides = true
        break
      }
    }

    return new OrigDateTimeFormat(locales, {
      calendar: calendarID,
      ...(anyOverrides ? options : availableOptions),
      ...finalOptions,
      timeZone: timeZoneID, // guaranteed to be defined because of above 'UTC'
      timeZoneName: undefined, // never show timeZone name
    })
  }

  let buildEpochMilli: (entity: Entity) => number

  if (options.timeZone !== undefined) {
    const timeZone = new TimeZone(options.timeZone)

    buildEpochMilli = (entity: Entity) => {
      const plainDateTime = createDateTime({ // necessary? pass directly into getInstantFor?
        ...zeroTimeISOFields,
        ...entity.getISOFields(),
      })
      return timeZone.getInstantFor(plainDateTime).epochMilliseconds
    }
  } else {
    buildEpochMilli = (entity: Entity) => {
      return isoFieldsToEpochMilli(entity.getISOFields())
    }
  }

  return {
    buildKey,
    buildFormat,
    buildEpochMilli,
  }
}

function createKeyBuilder<Entity extends BaseEntity>(
  locales: string[],
  options: Intl.DateTimeFormatOptions,
  strictCalendar: boolean | undefined,
) {
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
