import * as errorMessages from './errorMessages'
import { formatOffsetNano } from './isoFormat'
import { parseOffsetNanoMaybe } from './isoParse'
import { capitalize } from './utils'

export function parseTimeZoneOffsetId(id: string):
  | {
      id: string
      offsetNano: number
      compareKey: number
    }
  | undefined {
  const offsetNano = parseOffsetNanoMaybe(id.toUpperCase(), true)

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

export function normalizeNamedTimeZoneId(id: string): string {
  if (badCharactersRegExp.test(id)) {
    throw new RangeError(errorMessages.invalidTimeZone(id))
  }

  if (icuRegExp.test(id)) {
    // TODO: give identifier
    throw new RangeError(errorMessages.forbiddenIcuTimeZone)
  }

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
