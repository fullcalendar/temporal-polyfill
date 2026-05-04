export function parseIntlPartsYear(intlParts: Record<string, string>): number {
  return parseInt(intlParts.relatedYear || intlParts.year)
}
