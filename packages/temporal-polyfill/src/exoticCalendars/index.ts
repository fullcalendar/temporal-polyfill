import { type ExoticCalendar } from '../internal/calendarSlot'
import * as errorMessages from '../internal/errorMessages'
import { memoize } from '../internal/utils'
import { createBuddhistCalendar } from './buddhistCalendar'
import { getChineseDangiCalendar } from './chineseDangiCalendar'
import {
  createCopticCalendar,
  createEthiopicCalendar,
} from './copticEthiopicCalendar'
import { createHebrewCalendar } from './hebrewCalendar'
import { createIndianCalendar } from './indianCalendar'
import { createIslamicCalendar } from './islamicCalendar'
import { createJapaneseCalendar } from './japaneseCalendar'
import { createPersianCalendar } from './persianCalendar'
import { createRocCalendar } from './rocCalendar'

// This module is only the package-local calendar router. Calendar math and
// per-family data should stay in the sibling calendar/family modules.
const specificCalendarIds: Record<string, true> = {
  'buddhist': true,
  'chinese': true,
  'coptic': true,
  'dangi': true,
  'ethioaa': true,
  'ethiopic': true,
  'hebrew': true,
  'indian': true,
  'islamic-civil': true,
  'islamic-tbla': true,
  'islamic-umalqura': true,
  'japanese': true,
  'persian': true,
  'roc': true,
}

// These aliases are Temporal-recognized legacy calendar IDs. Keep them in the
// addon so core validation does not need to ask Intl about non-core calendars.
const deprecatedCalendarIdMap = {
  'ethiopic-amete-alem': 'ethioaa',
  'islamicc': 'islamic-civil',
} as const

export function getExoticCalendar(lowerRawCalendarId: string) {
  // Distinguish deprecated aliases from fallback-only IDs. Temporal accepts
  // true aliases like `islamicc`, but rejects broad Intl fallbacks.
  if (
    lowerRawCalendarId === 'islamic' ||
    lowerRawCalendarId === 'islamic-rgsa'
  ) {
    throw new RangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }

  const deprecatedNormCalendarId =
    deprecatedCalendarIdMap[
      lowerRawCalendarId as keyof typeof deprecatedCalendarIdMap
    ]

  const normCalendarId: string = deprecatedNormCalendarId || lowerRawCalendarId

  if (isSpecificCalendarId(normCalendarId)) {
    return getSpecificCalendar(normCalendarId)
  }

  throw new RangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
}

function isSpecificCalendarId(normCalendarId: string): boolean {
  return Boolean(specificCalendarIds[normCalendarId])
}

const getSpecificCalendar = memoize(createSpecificCalendar)

function createSpecificCalendar(normCalendarId: string): ExoticCalendar {
  switch (normCalendarId) {
    case 'buddhist':
      return createBuddhistCalendar()
    case 'chinese':
    case 'dangi':
      return getChineseDangiCalendar(normCalendarId)
    case 'coptic':
      return createCopticCalendar()
    case 'ethioaa':
      return createEthiopicCalendar(true)
    case 'ethiopic':
      return createEthiopicCalendar(false)
    case 'hebrew':
      return createHebrewCalendar()
    case 'indian':
      return createIndianCalendar()
    case 'japanese':
      return createJapaneseCalendar()
    case 'islamic-civil':
    case 'islamic-tbla':
    case 'islamic-umalqura':
      return createIslamicCalendar(normCalendarId)
    case 'persian':
      return createPersianCalendar()
    case 'roc':
      return createRocCalendar()
  }

  throw new RangeError(`Unknown calendar: ${normCalendarId}`)
}
