import {
  type ExoticCalendar,
  type ExoticCalendarWithoutId,
} from '../internal/calendarImpl'
import * as errorMessages from '../internal/errorMessages'
import { memoize, throwRangeError } from '../internal/utils'
import { createBuddhistCalendar } from './buddhistCalendar'
import { createChineseDangiCalendar } from './chineseDangiCalendar'
import {
  createCopticCalendar,
  createEthiopicAmeteAlemCalendar,
  createEthiopicCalendar,
} from './copticEthiopicCalendar'
import { createHebrewCalendar } from './hebrewCalendar'
import { createIndianCalendar } from './indianCalendar'
import {
  createIslamicCivilCalendar,
  createIslamicTabularCalendar,
  createIslamicUmmAlQuraCalendar,
} from './islamicCalendar'
import { createJapaneseCalendar } from './japaneseCalendar'
import { createPersianCalendar } from './persianCalendar'
import { createRocCalendar } from './rocCalendar'

// Config
// ------

export type CalendarImplTuple = readonly [
  canonicalId: string,
  createImpl: (canonicalId: string) => ExoticCalendarWithoutId,
]

export const buddhistMeta: CalendarImplTuple = [
  'buddhist',
  createBuddhistCalendar,
]
export const chineseMeta: CalendarImplTuple = [
  'chinese',
  createChineseDangiCalendar,
]
export const copticMeta: CalendarImplTuple = ['coptic', createCopticCalendar]
export const dangiMeta: CalendarImplTuple = [
  'dangi',
  createChineseDangiCalendar,
]
export const ethiopicMeta: CalendarImplTuple = [
  'ethiopic',
  createEthiopicCalendar,
]
export const ethiopicAmeteAlemMeta: CalendarImplTuple = [
  'ethioaa',
  createEthiopicAmeteAlemCalendar,
]
export const hebrewMeta: CalendarImplTuple = ['hebrew', createHebrewCalendar]
export const indianMeta: CalendarImplTuple = ['indian', createIndianCalendar]
export const japaneseMeta: CalendarImplTuple = [
  'japanese',
  createJapaneseCalendar,
]
export const islamicCivilMeta: CalendarImplTuple = [
  'islamic-civil',
  createIslamicCivilCalendar,
]
export const islamicTabularMeta: CalendarImplTuple = [
  'islamic-tbla',
  createIslamicTabularCalendar,
]
export const islamicUmmAlQuraMeta: CalendarImplTuple = [
  'islamic-umalqura',
  createIslamicUmmAlQuraCalendar,
]
export const persianMeta: CalendarImplTuple = ['persian', createPersianCalendar]
export const rocMeta: CalendarImplTuple = ['roc', createRocCalendar]

// keep this right below *Meta consts for minification reasons
const exoticCreatorMap = new Map([
  buddhistMeta,
  chineseMeta,
  copticMeta,
  dangiMeta,
  ethiopicMeta,
  ethiopicAmeteAlemMeta,
  hebrewMeta,
  indianMeta,
  japaneseMeta,
  islamicCivilMeta,
  islamicTabularMeta,
  islamicUmmAlQuraMeta,
  persianMeta,
  rocMeta,
])

// Distinguish deprecated aliases from fallback-only IDs. Temporal accepts
// true aliases like `islamicc`, but rejects broad Intl fallbacks.
// TODO: use Set?
const forbiddenExoticCalendarIdMap: Record<string, number> = {
  'islamic': 1,
  'islamic-rgsa': 1,
}

// These aliases are Temporal-recognized legacy calendar IDs. Keep them in the
// addon so basic validation does not need to ask Intl about non-basic calendars.
const deprecatedExoticCalendarIdMap: Record<string, string> = {
  'ethiopic-amete-alem': 'ethioaa',
  'islamicc': 'islamic-civil',
}

// Exotic Individual-Querying
// --------------------------

const getOrCreateExoticCalendar = memoize(
  (
    canonicalId: string,
    createExoticCalendar: (canonicalId: string) => ExoticCalendarWithoutId,
  ) => {
    const calendar = createExoticCalendar(canonicalId) as ExoticCalendar
    calendar.id = canonicalId
    return calendar
  },
)

/*
Used to create a stable identified ExoticCalendar when caller has guaranteed
calendar metadata.
*/
export function createExoticCalendarGetter(
  meta: CalendarImplTuple,
): () => ExoticCalendar {
  return () => getOrCreateExoticCalendar(...meta)
}

// Exotic Map-Querying
// -------------------

/*
Uses a cache. Immediately throws if doesn't exist
*/
export function getExoticCalendarById(
  lowerRawCalendarId: string,
): ExoticCalendar {
  const meta = queryExoticCalendarMeta(lowerRawCalendarId)
  if (!meta) {
    // TODO: specific message for *full* entrypoint loaded, but still unknown
    throwRangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }
  return getOrCreateExoticCalendar(...meta)
}

export function queryExoticCalendarMeta(
  lowerRawCalendarId: string,
): CalendarImplTuple | undefined {
  if (forbiddenExoticCalendarIdMap[lowerRawCalendarId]) {
    // TODO: specific message for "forbidden" calendar?
    throwRangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }

  const normCalendarId =
    deprecatedExoticCalendarIdMap[lowerRawCalendarId] || lowerRawCalendarId

  const createCalendar = exoticCreatorMap.get(normCalendarId)
  return createCalendar && [normCalendarId, createCalendar]
}
