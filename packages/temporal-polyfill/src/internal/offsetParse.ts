import * as errorMessages from './errorMessages'
import { timeRegExpStr } from './timeParse'
import { nanoInHour, nanoInMinute, nanoInSec, nanoInUtcDay } from './units'
import {
  createRegExp,
  parseInt0,
  parseSign,
  parseSubsecNano,
  signRegExpStr,
  validateTimeSeparators,
} from './utils'

export const offsetRegExpStr =
  signRegExpStr + // 1:offsetSign
  timeRegExpStr // 2:hour, 3:minute, 4:second, 5:afterDecimal

const offsetRegExp = createRegExp(offsetRegExpStr)

export function parseOffsetNano(s: string): number {
  const offsetNano = parseOffsetNanoMaybe(s)
  if (offsetNano === undefined) {
    throw new RangeError(errorMessages.failedParse(s)) // Invalid offset string
  }
  return offsetNano
}

export function parseOffsetNanoMaybe(
  s: string,
  onlyHourMinute?: boolean,
): number | undefined {
  const parts = offsetRegExp.exec(s)
  if (!parts) return undefined
  if (!validateOffsetSeparators(parts[0])) return undefined
  return organizeOffsetParts(parts, onlyHourMinute)
}

export function validateOffsetSeparators(s: string): boolean {
  return validateTimeSeparators(s.slice(1))
}

export function offsetHasSeconds(offset: string): boolean {
  return offset.replace(/\D/g, '').length > 4
}

export function validateTimeZoneOffset(offsetNano: number): number {
  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError(errorMessages.outOfBoundsOffset)
  }
  return offsetNano
}

function organizeOffsetParts(
  parts: string[],
  onlyHourMinute?: boolean,
): number {
  const firstSubMinutePart = parts[4] || parts[5]

  if (onlyHourMinute && firstSubMinutePart) {
    throw new RangeError(errorMessages.invalidSubstring(firstSubMinutePart))
  }

  const offsetNanoPos =
    parseInt0(parts[2]) * nanoInHour +
    parseInt0(parts[3]) * nanoInMinute +
    parseInt0(parts[4]) * nanoInSec +
    parseSubsecNano(parts[5] || '')

  return validateTimeZoneOffset(offsetNanoPos * parseSign(parts[1]))
}
