import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { createDateTime } from '../dateUtils/dateTime'
import { isoFieldsToEpochMilli } from '../dateUtils/isoMath'
import { zeroTimeISOFields } from '../dateUtils/zonedDateTime'
import { Calendar } from '../public/calendar'
import { Instant } from '../public/instant'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainTime } from '../public/plainTime'
import { PlainYearMonth } from '../public/plainYearMonth'
import { TimeZone } from '../public/timeZone'
import { DateISOFields, LocalesArg } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'

// TODO: rethink if everything belongs in this 'native' file???

export interface DateTimeFormatRangePart extends Intl.DateTimeFormatPart {
  source: 'startDate' | 'endDate'
}

export interface DateTimeFormatRangeMethods {
  formatRange(startDate: number | Date, endDate: number | Date): string
  formatRangeToParts(startDate: number | Date, endDate: number | Date): DateTimeFormatRangePart[]
}

export type DateTimeFormatWithRange = Intl.DateTimeFormat & DateTimeFormatRangeMethods

// adding Temporal

export type DateTimeFormatArg =
  number |
  Date |
  Instant |
  ZonedDateTime |
  PlainDateTime |
  PlainDate |
  PlainYearMonth |
  PlainMonthDay |
  PlainTime

/*
SPECIAL NOTE:
Must keep in sync with global.ts
Was impossible to extend a global object similar to DateTemporalMethods
TODO: file bug with TypeScript
*/
export interface DateTimeFormatTemporalMethods {
  format(dateArg?: DateTimeFormatArg): string
  formatToParts(dateArg?: DateTimeFormatArg): Intl.DateTimeFormatPart[]
  formatRange(startArg: DateTimeFormatArg, endArg: DateTimeFormatArg): string
  formatRangeToParts(
    startArg: DateTimeFormatArg,
    endArg: DateTimeFormatArg
  ): DateTimeFormatRangePart[]
}

export type DateTimeFormatWithTemporal = Intl.DateTimeFormat & DateTimeFormatTemporalMethods

// TODO: unify this as a class/const, to just export DateTimeFormat,
// and have whole src reference it only, not Intl.DateTimeFormat
export const OrigDateTimeFormat = Intl.DateTimeFormat

export function normalizeIntlOptionalDateArg(
  dateArg: DateTimeFormatArg | undefined,
): undefined | number | Date {
  return dateArg === undefined ? dateArg : normalizeIntlDateArg(dateArg)
}

export function normalizeIntlDateArg(dateArg: DateTimeFormatArg): number | Date {
  return (typeof dateArg === 'number' || dateArg instanceof Date)
    ? dateArg
    : (dateArg instanceof Instant || dateArg instanceof ZonedDateTime)
        ? dateArg.epochMilliseconds
        : isoFieldsToEpochMilli(dateArg.getISOFields())
}

//
// Format Config Generation
// TODO: fix naming collision with other formatConfig
//

export function formatWithConfig<Entity>(
  entity: Entity,
  formatConfig: FormatConfig<Entity>,
): string {
  const [calendarID, timeZoneID] = formatConfig.buildKey(entity)
  return formatConfig.buildFormat(calendarID, timeZoneID).format(
    formatConfig.buildEpochMilli(entity),
  )
}

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
  buildKey: (entity: Entity) => [string, string]
  buildFormat: (calendarID: string, timeZoneID: string) => Intl.DateTimeFormat
  buildEpochMilli: (entity: Entity) => number
}

export function buildZonedFormatConfig<Entity extends ZonedEntity>(
  localesArg: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
): FormatConfig<Entity> {
  const buildKey = createKeyBuilder<Entity>(localesArg, options, false)

  function buildFormat(calendarID: string, timeZoneID: string): Intl.DateTimeFormat {
    return new OrigDateTimeFormat(localesArg, {
      calendar: calendarID,
      timeZone: timeZoneID || undefined, // empty string should mean current timezone
      ...options,
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
  localesArg: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  strictCalendar?: boolean,
): FormatConfig<Entity> {
  const buildKey = createKeyBuilder(localesArg, options, strictCalendar)

  function buildFormat(calendarID: string, timeZoneID: string) {
    return new OrigDateTimeFormat(localesArg, {
      calendar: calendarID,
      ...options,
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
  localesArg: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  strictCalendar: boolean | undefined,
) {
  const optionsCalendarID = options.calendar ?? extractUnicodeCalendar(localesArg)
  const optionsTimeZoneID = options.timeZone

  return function(entity: Entity): [string, string] {
    const entityCalendarID = entity.calendar?.id
    const entityTimeZoneID = entity.timeZone?.id

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

function extractUnicodeCalendar(locales: LocalesArg | undefined): string | undefined {
  const localesArray = ([] as string[]).concat(locales || [])

  for (const locale of localesArray) {
    const m = locale.match(/-u-ca-(.*)$/)
    if (m) {
      return m[1]
    }
  }

  return undefined
}
