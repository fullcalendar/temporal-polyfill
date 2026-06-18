import {
  CalendarImplTuple,
  buddhistMeta,
  chineseMeta,
  copticMeta,
  createExoticCalendarGetter,
  dangiMeta,
  ethiopicAmeteAlemMeta,
  ethiopicMeta,
  hebrewMeta,
  indianMeta,
  islamicCivilMeta,
  islamicTabularMeta,
  islamicUmmAlQuraMeta,
  japaneseMeta,
  persianMeta,
  queryExoticCalendarMeta,
  rocMeta,
} from '../exoticCalendars/index'
import { gregoryCalendarImpl, isoCalendarImpl } from '../internal/calendarImpl'
import { requireString } from '../internal/cast'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'
import { memoize } from '../internal/utils'
import { createCalendarRecord } from './calendarRecord'
import type { CalendarRecord as Record } from './recordTypes'

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
export const getROC = createCanonicalGetter(rocMeta)

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
  return getOrCreateUnknownRecord(rawCalendarId)
}

export function getAny(rawCalendarId: string): Record {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  if (lowerRawCalendarId === isoCalendarId) {
    return isoCalendarRecord
  }
  if (lowerRawCalendarId === gregoryCalendarId) {
    return gregoryCalendarRecord
  }

  const meta = queryExoticCalendarMeta(lowerRawCalendarId)
  return meta
    ? getOrCreateFoundRecord(rawCalendarId, meta)
    : getOrCreateUnknownRecord(rawCalendarId)
}

export function getExotic(rawCalendarId: string): Record {
  const lowerRawCalendarId = requireString(rawCalendarId).toLowerCase()

  const meta = queryExoticCalendarMeta(lowerRawCalendarId)
  return meta
    ? getOrCreateFoundRecord(rawCalendarId, meta)
    : getOrCreateUnknownRecord(rawCalendarId)
}

// utils
// -----

const getOrCreateFoundRecord = memoize(
  (rawCalendarId: string, meta: CalendarImplTuple): Record =>
    createCalendarRecord(rawCalendarId, createExoticCalendarGetter(meta)),
)

// Basic-only callers must not inherit an exotic implementation from a hot
// cache. Keep unresolved records and exotic-capable records in separate
// keyspaces even when they have the same user-visible calendar ID.
const getOrCreateUnknownRecord = memoize(createCalendarRecord) as (
  rawCalendarId: string,
) => Record

function createCanonicalGetter(meta: CalendarImplTuple): () => Record {
  return () => getOrCreateFoundRecord(meta[0], meta)
}
