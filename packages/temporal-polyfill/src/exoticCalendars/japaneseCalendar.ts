import { gregoryEraOrigins } from '../internal/intlCalendarConfig'
import { computeGregoryEraFields } from '../internal/isoCalendarMath'
import { createGregoryAlignedCalendar } from './utils/gregoryAlignedCalendar'

const japaneseEraOrigins = {
  ...gregoryEraOrigins,
  'meiji': 1867,
  'taisho': 1911,
  'showa': 1925,
  'heisei': 1988,
  'reiwa': 2018,
}

const japaneseEras = [
  { name: 'meiji', originYear: 1867, start: [1873, 1, 1] },
  { name: 'taisho', originYear: 1911, start: [1912, 7, 30] },
  { name: 'showa', originYear: 1925, start: [1926, 12, 25] },
  { name: 'heisei', originYear: 1988, start: [1989, 1, 8] },
  { name: 'reiwa', originYear: 2018, start: [2019, 5, 1] },
] as const

export function createJapaneseCalendar() {
  return createGregoryAlignedCalendar({
    id: 'japanese',
    eraOrigins: japaneseEraOrigins,
    removeEraFieldsOnMonthDayReplace: true,
    computeEraFields(isoDate) {
      return computeJapaneseEraFields(isoDate)
    },
  })
}

function computeJapaneseEraFields(isoDate: {
  year: number
  month: number
  day: number
}) {
  for (let i = japaneseEras.length - 1; i >= 0; i--) {
    const era = japaneseEras[i]
    if (compareIsoDate(isoDate, era.start) >= 0) {
      return { era: era.name, eraYear: isoDate.year - era.originYear }
    }
  }

  // Temporal's Japanese era round-tripping follows the Gregorian-aligned era
  // model used by test262; dates before ISO 1873-01-01 stay on CE/BCE instead
  // of exposing ICU's historical Japanese era labels.
  return computeGregoryEraFields(isoDate)
}

function compareIsoDate(
  isoDate: { year: number; month: number; day: number },
  isoParts: readonly [number, number, number],
) {
  return (
    isoDate.year - isoParts[0] ||
    isoDate.month - isoParts[1] ||
    isoDate.day - isoParts[2]
  )
}
