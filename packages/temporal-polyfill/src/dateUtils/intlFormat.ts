
export type IntlFormatPartsMap = { [partType: string]: string }

export function hashIntlFormatParts(
  format: Intl.DateTimeFormat,
  epochMillisecond: number,
): IntlFormatPartsMap {
  const hash: IntlFormatPartsMap = {}
  const parts = format.formatToParts(epochMillisecond)

  for (const part of parts) {
    hash[part.type] = part.value
  }

  return hash
}
