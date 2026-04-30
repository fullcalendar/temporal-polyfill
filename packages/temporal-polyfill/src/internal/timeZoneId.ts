import { requireString } from './cast'
import { isoCalendarId } from './intlCalendarConfig'
import { RawDateTimeFormat } from './intlFormatUtils'
import { utcTimeZoneId } from './timeZoneConfig'
import {
  normalizeNamedTimeZoneId,
  parseTimeZoneOffsetId,
} from './timeZoneParse'
import { memoize } from './utils'

export function refineTimeZoneId(id: string): string {
  return resolveTimeZoneId(requireString(id))
}

export function resolveTimeZoneId(id: string): string {
  return resolveTimeZoneRecord(id).id
}

export function getTimeZoneAtomic(id: string): string | number {
  return resolveTimeZoneRecord(id).compareKey
}

export type ResolvedTimeZone =
  | {
      kind: 'utc'
      id: string
      compareKey: string
    }
  | {
      kind: 'fixed'
      id: string
      offsetNano: number
      compareKey: number
    }
  | {
      kind: 'named'
      id: string
      format: Intl.DateTimeFormat
      compareKey: string
    }

export const resolveTimeZoneRecord = memoize((id: string): ResolvedTimeZone => {
  const upperId = id.toUpperCase()

  const offsetRecord = parseTimeZoneOffsetId(upperId)
  if (offsetRecord) {
    return {
      kind: 'fixed',
      ...offsetRecord,
    }
  }

  // Keep UTC distinct from +00:00. They both perform fixed-zero math, but
  // Temporal equality compares UTC by name and offset zones by offset number.
  if (upperId === utcTimeZoneId) {
    return {
      kind: 'utc',
      id: utcTimeZoneId,
      compareKey: utcTimeZoneId,
    }
  }

  const format = queryTimeZoneIntlFormat(upperId)
  return {
    kind: 'named',
    id: normalizeNamedTimeZoneId(id),
    format,
    compareKey: format.resolvedOptions().timeZone,
  }
})

/**
 * @param id Expects uppercase
 */
const queryTimeZoneIntlFormat = memoize((id: string): Intl.DateTimeFormat => {
  const options = {
    calendar: isoCalendarId,
    timeZone: id,
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  } as Intl.DateTimeFormatOptions
  return new RawDateTimeFormat('en', options)
})
