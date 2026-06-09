import { type ExoticCalendar } from '../internal/calendarImpl'
import * as errorMessages from '../internal/errorMessages'
import { memoize } from '../internal/utils'
import { createBuddhistCalendar } from './buddhistCalendar'
import {
  createChineseCalendar,
  createDangiCalendar,
} from './chineseDangiCalendar'
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
  canonicalCalendarId: string,
  createImpl: () => ExoticCalendar,
]

export const buddhistMeta: CalendarImplTuple = [
  'buddhist',
  createBuddhistCalendar,
]
export const chineseMeta: CalendarImplTuple = ['chinese', createChineseCalendar]
export const copticMeta: CalendarImplTuple = ['coptic', createCopticCalendar]
export const dangiMeta: CalendarImplTuple = ['dangi', createDangiCalendar]
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

// Distinguish deprecated aliases from fallback-only IDs. Temporal accepts
// true aliases like `islamicc`, but rejects broad Intl fallbacks.
// TODO: use Set?
const forbiddenExoticCalendarIdMap: Record<string, boolean> = {
  'islamic': true,
  'islamic-rgsa': true,
}

// These aliases are Temporal-recognized legacy calendar IDs. Keep them in the
// addon so basic validation does not need to ask Intl about non-basic calendars.
const deprecatedExoticCalendarIdMap: Record<string, string> = {
  'ethiopic-amete-alem': 'ethioaa',
  'islamicc': 'islamic-civil',
}

// Exotic Individual Utils
// -----------------------

/*
Used to create a stable ExoticCalendar when caller has guaranteed creator-function
*/
export const getOrCreateExoticCalendar = memoize(
  (createExoticCalendar: () => ExoticCalendar) => createExoticCalendar(),
)

/*
If creator-function undefined, returns undefined
Otherwise, returns cached getter function
Built for CalendarRecord lazy-resolution

TODO: move this to funcApi/calendar.ts ???
*/
export function createExoticCalendarGetter(
  createExoticCalendar: (() => ExoticCalendar) | undefined,
): (() => ExoticCalendar) | undefined {
  return createExoticCalendar
    ? () => getOrCreateExoticCalendar(createExoticCalendar)
    : undefined
}

// Exotic Map Querying
// -------------------

const exoticMapTuples = [
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
]
const exoticCreatorMap = new Map(exoticMapTuples)

/*
Uses a cache. Immediately throws if doesn't exist
*/
export function getExoticCalendarById(
  lowerRawCalendarId: string,
): ExoticCalendar {
  const createCalendar = queryExoticCalendarCreator(lowerRawCalendarId)
  if (!createCalendar) {
    // TODO: specific message for *full* entrypoint loaded, but still unknown
    throw new RangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }
  return getOrCreateExoticCalendar(createCalendar)
}

export function queryExoticCalendarCreator(
  lowerRawCalendarId: string,
): (() => ExoticCalendar) | undefined {
  if (forbiddenExoticCalendarIdMap[lowerRawCalendarId]) {
    // TODO: specific message for "forbidden" calendar?
    throw new RangeError(errorMessages.invalidCalendar(lowerRawCalendarId))
  }

  const normCalendarId =
    deprecatedExoticCalendarIdMap[lowerRawCalendarId] || lowerRawCalendarId

  return exoticCreatorMap.get(normCalendarId)
}
