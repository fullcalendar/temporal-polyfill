
export type IntlFormatPartsMap = { [partType: string]: string }

export function hashIntlFormatParts(
  format: Intl.DateTimeFormat,
  epochMillisecond: number,
): IntlFormatPartsMap {
  const hash: IntlFormatPartsMap = {}
  const parts = format.formatToParts(epochMillisecond) // TODO: use original methods

  for (const part of parts) {
    hash[part.type] = part.value
  }

  return hash
}

const eraRemap: { [eraIn: string]: string } = {
  bc: 'bce',
  ad: 'ce',
}

export function normalizeShortEra(formattedEra: string): string {
  // Example 'Before R.O.C.' -> 'beforeroc'
  formattedEra = formattedEra
    .toLowerCase()
    .normalize('NFD') // break apart accents, for 'Shōwa' -> 'Showa'
    .replace(/[^a-z0-9]/g, '')

  return eraRemap[formattedEra] || formattedEra
}
