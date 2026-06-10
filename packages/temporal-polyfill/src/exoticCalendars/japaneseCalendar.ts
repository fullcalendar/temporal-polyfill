import { isoDateToEpochDays } from '../internal/epochMath'
import { gregoryEraOrigins } from '../internal/intlCalendarConfig'
import { computeGregoryEraFields } from '../internal/isoCalendarMath'
import { createGregoryAlignedCalendar } from './utils/gregoryAlignedCalendar'

// For converting era+eraYear => ISO-year
const japaneseEraOrigins = {
  ...gregoryEraOrigins,
  'meiji': 1867,
  'taisho': 1911,
  'showa': 1925,
  'heisei': 1988,
  'reiwa': 2018,
}

const meijiStartEpochDays = -35428 // 1873-01-01
const taishoStartEpochDays = -20974 // 1912-07-30
const showaStartEpochDays = -15713 // 1926-12-25
const heiseiStartEpochDays = 6947 // 1989-01-08
const reiwaStartEpochDays = 18017 // 2019-05-01

export function createJapaneseCalendar() {
  return createGregoryAlignedCalendar({
    eraOrigins: japaneseEraOrigins,
    erasBeginMidYear: true,
    computeEraFields: computeJapaneseEraFields,
  })
}

// For converting ISO-YMD => era+eraYear
function computeJapaneseEraFields(isoDate: {
  year: number
  month: number
  day: number
}) {
  const epochDays = isoDateToEpochDays(isoDate)

  const era =
    epochDays >= reiwaStartEpochDays
      ? 'reiwa'
      : epochDays >= heiseiStartEpochDays
        ? 'heisei'
        : epochDays >= showaStartEpochDays
          ? 'showa'
          : epochDays >= taishoStartEpochDays
            ? 'taisho'
            : epochDays >= meijiStartEpochDays
              ? 'meiji'
              : undefined

  if (era) {
    return { era, eraYear: isoDate.year - japaneseEraOrigins[era] }
  }

  // Temporal's Japanese era round-tripping follows the Gregorian-aligned era
  // model used by test262; dates before ISO 1873-01-01 stay on CE/BCE instead
  // of exposing ICU's historical Japanese era labels.
  return computeGregoryEraFields(isoDate)
}
