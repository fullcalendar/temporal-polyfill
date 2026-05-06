import { requireString } from './cast'
import { isoCalendarId } from './intlCalendarConfig'
import { RawDateTimeFormat } from './intlFormatUtils'
import { utcTimeZoneId } from './timeZoneConfig'
import {
  normalizeNamedTimeZoneId,
  parseTimeZoneOffsetId,
} from './timeZoneParse'
import { memoize } from './utils'

export function refineTimeZoneId(rawId: string): string {
  return resolveTimeZoneId(requireString(rawId))
}

export function resolveTimeZoneId(rawId: string): string {
  return resolveTimeZoneRecord(rawId).id
}

export function getTimeZoneAtomic(rawId: string): string | number {
  return resolveTimeZoneRecord(rawId).compareKey
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

export function resolveTimeZoneRecord(rawId: string): ResolvedTimeZone {
  const upperRawId = rawId.toUpperCase()

  const offsetRecord = parseTimeZoneOffsetId(upperRawId)
  if (offsetRecord) {
    return {
      kind: 'fixed',
      ...offsetRecord,
    }
  }

  // Keep UTC distinct from +00:00. They both perform fixed-zero math, but
  // Temporal equality compares UTC by name and offset zones by offset number.
  const normId =
    upperRawId === utcTimeZoneId
      ? utcTimeZoneId
      : normalizeNamedTimeZoneId(rawId)

  return queryNamedTimeZoneRecord(normId)
}

const queryNamedTimeZoneRecord = memoize((normId: string): ResolvedTimeZone => {
  if (normId === utcTimeZoneId) {
    return {
      kind: 'utc',
      id: normId,
      compareKey: normId,
    }
  }

  const upperNormId = normId.toUpperCase()
  const format = queryTimeZoneIntlFormat(upperNormId)
  return {
    kind: 'named',
    id: normId,
    format,
    compareKey: format.resolvedOptions().timeZone,
  }
})

/**
 * @param upperNormId Expects normalized + uppercase
 */
const queryTimeZoneIntlFormat = memoize(
  (upperNormId: string): Intl.DateTimeFormat => {
    const options = {
      calendar: isoCalendarId,
      timeZone: upperNormId,
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
  },
)
