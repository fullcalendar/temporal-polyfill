import { formatOffsetNano } from './isoFormat'
import { parseOffsetNanoMaybe } from './isoParse'
import { utcTimeZoneId } from './timeZoneConfig'
import { queryFormatForTimeZone } from './timeZoneNative'
import { capitalize } from './utils'

export function resolveTimeZoneId(id: string): string {
  const spirit = getTimeZoneSpirit(id)
  return typeof spirit === 'number'
    ? formatOffsetNano(spirit)
    : spirit
      ? normalizeNamedTimeZoneId(id)
      : utcTimeZoneId
}

export function getTimeZoneComparator(id: string): string | number {
  const spirit = getTimeZoneSpirit(id)
  return typeof spirit === 'number'
    ? spirit
    : spirit
      ? spirit.resolvedOptions().timeZone
      : utcTimeZoneId
}

// returning undefined means utcTimeZoneId
export function getTimeZoneSpirit(
  id: string,
): number | Intl.DateTimeFormat | undefined {
  const offsetNano = parseOffsetNanoMaybe(id, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return offsetNano
  }
  if (id.toUpperCase() !== utcTimeZoneId) {
    return queryFormatForTimeZone(id) // case-agnostic
  }
}

function normalizeNamedTimeZoneId(s: string): string {
  const lower = s.toLowerCase()
  const parts = lower.split('/')

  return parts
    .map((part, partI) => {
      // abbreviation-like (big parts, like 'ACT' in 'Australia/ACT')
      // OR numeric-offset-like
      // OR Pacific/YAP
      if ((part.length <= 3 || part.match(/\d/)) && !part.match(/etc|yap/)) {
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
