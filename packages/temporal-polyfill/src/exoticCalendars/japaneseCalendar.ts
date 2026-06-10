import { isoArgsToEpochDays, isoDateToEpochDays } from '../internal/epochMath'
import { gregoryEraOrigins } from '../internal/intlCalendarConfig'
import { computeGregoryEraFields } from '../internal/isoCalendarMath'
import { compareNumbers } from '../internal/utils'
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
  {
    name: 'meiji',
    originYear: 1867,
    startEpochDays: isoArgsToEpochDays(1873, 1, 1),
  },
  {
    name: 'taisho',
    originYear: 1911,
    startEpochDays: isoArgsToEpochDays(1912, 7, 30),
  },
  {
    name: 'showa',
    originYear: 1925,
    startEpochDays: isoArgsToEpochDays(1926, 12, 25),
  },
  {
    name: 'heisei',
    originYear: 1988,
    startEpochDays: isoArgsToEpochDays(1989, 1, 8),
  },
  {
    name: 'reiwa',
    originYear: 2018,
    startEpochDays: isoArgsToEpochDays(2019, 5, 1),
  },
] as const

export function createJapaneseCalendar() {
  return createGregoryAlignedCalendar({
    eraOrigins: japaneseEraOrigins,
    removeEraFieldsOnMonthDayReplace: true,
    computeEraFields: computeJapaneseEraFields,
  })
}

function computeJapaneseEraFields(isoDate: {
  year: number
  month: number
  day: number
}) {
  const epochDays = isoDateToEpochDays(isoDate)

  for (let i = japaneseEras.length - 1; i >= 0; i--) {
    const era = japaneseEras[i]
    if (compareNumbers(epochDays, era.startEpochDays) >= 0) {
      return { era: era.name, eraYear: isoDate.year - era.originYear }
    }
  }

  // Temporal's Japanese era round-tripping follows the Gregorian-aligned era
  // model used by test262; dates before ISO 1873-01-01 stay on CE/BCE instead
  // of exposing ICU's historical Japanese era labels.
  return computeGregoryEraFields(isoDate)
}
