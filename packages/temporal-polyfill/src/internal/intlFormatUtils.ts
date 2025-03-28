import * as errorMessages from './errorMessages'
import { maxMilli } from './timeMath'

export type LocalesArg = string | string[]
export type OptionNames = (keyof Intl.DateTimeFormatOptions)[]
export type RawFormattable = Date | number

export const RawDateTimeFormat = Intl.DateTimeFormat

export const standardLocaleId = 'en-GB' // 24-hour clock, gregorian by default

export function hashIntlFormatParts(
  intlFormat: Intl.DateTimeFormat,
  epochMilli: number,
): Record<string, string> {
  // TODO: best level for this?
  // Probably do it when date is *converted* to epochMilli
  if (epochMilli < -maxMilli) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  const parts = intlFormat.formatToParts(epochMilli)
  const hash = {} as Record<string, string>

  for (const part of parts) {
    hash[part.type] = part.value
  }

  return hash
}
