import { isoCalendarId } from './calendarConfig'
import { requireString } from './cast'
import * as errorMessages from './errorMessages'
import { RawDateTimeFormat } from './intlFormatUtils'
import { formatOffsetNano } from './isoFormat'
import { parseOffsetNanoMaybe } from './isoParse'
import { utcTimeZoneId } from './timeZoneConfig'
import { capitalize, memoize } from './utils'

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

  const offsetNano = parseOffsetNanoMaybe(upperId, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return {
      kind: 'fixed',
      id: formatOffsetNano(offsetNano),
      offsetNano,
      compareKey: offsetNano,
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

const icuRegExp =
  /^(AC|AE|AG|AR|AS|BE|BS|CA|CN|CS|CT|EA|EC|IE|IS|JS|MI|NE|NS|PL|PN|PR|PS|SS|VS)T$/

// TODO: move to parsing file?
const badCharactersRegExp = /[^\w\/:+-]+/

function normalizeNamedTimeZoneId(id: string): string {
  if (badCharactersRegExp.test(id)) {
    throw new RangeError(errorMessages.invalidTimeZone(id))
  }

  if (icuRegExp.test(id)) {
    // TODO: give identifier
    throw new RangeError(errorMessages.forbiddenIcuTimeZone)
  }

  // TODO:^^^ do above rejecting before expensive Intl.DateTimeFormat is created?

  return id
    .toLowerCase()
    .split('/')
    .map((part, partI) => {
      // abbreviation-like (big parts, like 'ACT' in 'Australia/ACT')
      // OR numeric-offset-like
      // OR Pacific/YAP
      if ((part.length <= 3 || /\d/.test(part)) && !/etc|yap/.test(part)) {
        return part.toUpperCase()
      }

      return part.replace(/baja|dumont|[a-z]+/g, (a, i) => {
        // abbreviation-like (small parts)
        // - starts with 1-or-2-letters?
        // - Knox_IN, NZ-CHAT
        if ((a.length <= 2 && !partI) || a === 'in' || a === 'chat') {
          return a.toUpperCase()
        }

        // word-like
        if (a.length > 2 || !i) {
          return capitalize(a).replace(
            /island|noronha|murdo|rivadavia|urville/,
            capitalize,
          )
        }

        // lowercase (au/of/es)
        return a
      })
    })
    .join('/')
}
