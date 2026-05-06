import * as errorMessages from './errorMessages'
import { formatOffsetNano } from './isoFormat'
import { parseOffsetNanoMaybe } from './offsetParse'
import { capitalize } from './utils'

export function parseTimeZoneOffsetId(upperRawId: string):
  | {
      id: string
      offsetNano: number
      compareKey: number
    }
  | undefined {
  const offsetNano = parseOffsetNanoMaybe(upperRawId, true)

  if (offsetNano === undefined) {
    return undefined
  }

  return {
    id: formatOffsetNano(offsetNano),
    offsetNano,
    compareKey: offsetNano,
  }
}

const icuRegExp =
  /^(AC|AE|AG|AR|AS|BE|BS|CA|CN|CS|CT|EA|EC|IE|IS|JS|MI|NE|NS|PL|PN|PR|PS|SS|VS)T$/

const badCharactersRegExp = /[^\w\/:+-]+/

export function normalizeNamedTimeZoneId(rawId: string): string {
  if (badCharactersRegExp.test(rawId)) {
    throw new RangeError(errorMessages.invalidTimeZone(rawId))
  }

  if (icuRegExp.test(rawId)) {
    // TODO: give identifier
    throw new RangeError(errorMessages.forbiddenIcuTimeZone)
  }

  return rawId
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
