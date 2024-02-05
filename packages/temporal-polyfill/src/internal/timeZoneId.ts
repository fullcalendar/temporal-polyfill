import { OrigDateTimeFormat, standardLocaleId } from './intlFormatUtils'
import { formatOffsetNano } from './isoFormat'
import { parseOffsetNanoMaybe } from './isoParse'
import { utcTimeZoneId } from './timeZoneConfig'
import { capitalize, createLazyGenerator } from './utils'

export function resolveTimeZoneId(id: string): string {
  const essence = getTimeZoneEssence(id)
  return typeof essence === 'number'
    ? formatOffsetNano(essence)
    : essence
      ? normalizeNamedTimeZoneId(id)
      : utcTimeZoneId
}

export function getTimeZoneAtomic(id: string): string | number {
  const essence = getTimeZoneEssence(id)
  return typeof essence === 'number'
    ? essence
    : essence
      ? essence.resolvedOptions().timeZone
      : utcTimeZoneId
}

/**
 * @returns Undefined means `utcTimeZoneId`
 */
export function getTimeZoneEssence(
  id: string,
): number | Intl.DateTimeFormat | undefined {
  id = id.toUpperCase()

  const offsetNano = parseOffsetNanoMaybe(id, true) // onlyHourMinute=true
  if (offsetNano !== undefined) {
    return offsetNano
  }

  if (id !== utcTimeZoneId) {
    return queryTimeZoneIntlFormat(id)
  }
}

/**
 * @param id Expects uppercase
 */
const queryTimeZoneIntlFormat = createLazyGenerator(
  (id: string): Intl.DateTimeFormat =>
    new OrigDateTimeFormat(standardLocaleId, {
      timeZone: id,
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }),
)

function normalizeNamedTimeZoneId(id: string): string {
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
