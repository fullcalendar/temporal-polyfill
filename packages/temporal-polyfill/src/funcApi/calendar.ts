import {
  CalendarImplTuple,
  buddhistMeta,
  chineseMeta,
  copticMeta,
  dangiMeta,
  ethiopicAmeteAlemMeta,
  ethiopicMeta,
  getOrCreateExoticCalendar,
  hebrewMeta,
  indianMeta,
  islamicCivilMeta,
  islamicTabularMeta,
  islamicUmmAlQuraMeta,
  japaneseMeta,
  persianMeta,
  queryExoticCalendarCreator,
  rocMeta,
} from '../exoticCalendars/index'
import {
  ExoticCalendar,
  gregoryCalendarImpl,
  isoCalendarImpl,
} from '../internal/calendarImpl'
import { requireString } from '../internal/cast'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'
import { memoize } from '../internal/utils'
import {
  CalendarRecord as Record,
  createCalendarRecord,
} from './calendarRecord'

export { Record }

// singletons
// ----------

const isoCalendarRecord = createCalendarRecord(
  isoCalendarId,
  () => isoCalendarImpl,
)
const gregoryCalendarRecord = createCalendarRecord(
  gregoryCalendarId,
  () => gregoryCalendarImpl,
)

export const getISO: () => Record = () => isoCalendarRecord
export const getGregory: () => Record = () => gregoryCalendarRecord

// exotic individual
// -----------------

export const getBuddhist = createCanonicalGetter(buddhistMeta)
export const getChinese = createCanonicalGetter(chineseMeta)
export const getCoptic = createCanonicalGetter(copticMeta)
export const getDangi = createCanonicalGetter(dangiMeta)
export const getEthiopic = createCanonicalGetter(ethiopicMeta)
export const getEthiopicAmeteAlem = createCanonicalGetter(ethiopicAmeteAlemMeta)
export const getHebrew = createCanonicalGetter(hebrewMeta)
export const getIndian = createCanonicalGetter(indianMeta)
export const getJapanese = createCanonicalGetter(japaneseMeta)
export const getIslamicCivil = createCanonicalGetter(islamicCivilMeta)
export const getIslamicTabular = createCanonicalGetter(islamicTabularMeta)
export const getIslamicUmmAlQura = createCanonicalGetter(islamicUmmAlQuraMeta)
export const getPersian = createCanonicalGetter(persianMeta)
export const getRoc = createCanonicalGetter(rocMeta)

// aggregate
// ---------

export function getBasic(rawCalendarId: string): Record {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendarRecord
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendarRecord
  }

  // will lazily error when getCalendarRecordImplCreator is called
  // TODO: make more formal creator for this?
  return getOrCreateRecord(rawCalendarId)
}

export function getAny(rawCalendarId: string): Record {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendarRecord
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendarRecord
  }

  const createImpl = queryExoticCalendarCreator(lowerRawCalendarId)
  return getOrCreateRecord(rawCalendarId, createImpl)
}

export function getExotic(rawCalendarId: string): Record {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  const createImpl = queryExoticCalendarCreator(lowerRawCalendarId)
  return getOrCreateRecord(rawCalendarId, createImpl)
}

// utils
// -----

const getOrCreateRecord = memoize(
  (
    rawCalendarId: string,
    createImpl?: () => ExoticCalendar, // if blank, unknown calendar
  ): Record => {
    const getImpl = createImpl
      ? () => getOrCreateExoticCalendar(createImpl)
      : undefined

    return createCalendarRecord(rawCalendarId, getImpl)
  },
)

function createCanonicalGetter([
  canonicalCalendarId,
  createImpl,
]: CalendarImplTuple): () => Record {
  return () => getOrCreateRecord(canonicalCalendarId, createImpl)
}
