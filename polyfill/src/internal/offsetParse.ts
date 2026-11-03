import * as errorMessages from './errorMessages'
import { nanoInHour, nanoInMinute, nanoInSec } from './units'
import { parseInt0, parseSign, parseSubsecNano, throwRangeError } from './utils'

// 1:sign, 2:hour, 3:sep, 4:minute, 5:second, 6:afterDecimal
// A literal, unlike the fragments in isoParse.ts, because a call here wouldn't tree-shake
// out of the shared chunk that every function API export imports.
const offsetRegExp =
  /^([+-])([01]\d|2[0-3])(?:(:?)([0-5]\d)(?:\3([0-5]\d)(?:[.,](\d{1,9}))?)?)?$/

export function parseOffsetNano(s: string): number {
  const offsetNano = parseOffsetNanoMaybe(s)
  if (offsetNano === undefined) {
    throwRangeError(errorMessages.failedParse(s)) // Invalid offset string
  }
  return offsetNano
}

export function parseOffsetNanoMaybe(
  s: string,
  onlyHourMinute?: boolean,
): number | undefined {
  const parts = offsetRegExp.exec(s)
  if (!parts) {
    return undefined
  }
  if (onlyHourMinute && parts[5]) {
    throwRangeError(errorMessages.failedParse(s))
  }
  return (
    parseSign(parts[1]) *
    (parseInt(parts[2]) * nanoInHour +
      parseInt0(parts[4]) * nanoInMinute +
      parseInt0(parts[5]) * nanoInSec +
      parseSubsecNano(parts[6] || ''))
  )
}

export function offsetHasSeconds(offset: string): boolean {
  return offset.length > 6 // longest without seconds is +hh:mm
}
