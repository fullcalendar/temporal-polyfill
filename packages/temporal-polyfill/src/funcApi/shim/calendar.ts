import { getExoticCalendar } from '../../exoticCalendars/index'
import {
  CalendarSlot,
  getCalendarSlotId,
  gregoryCalendar,
  isoCalendar,
} from '../../internal/calendarSlot'
import type { CalendarResolver } from '../../internal/isoParse'
import { memoize } from '../../internal/utils'
import type * as RecordTypes from '../recordTypes'
import { getCalendarSlots, setCalendarSlots } from '../temporalRecords'
import { attachDebugString, defineTemporalClass } from './recordUtils'

export type CalendarShimResolver = (calendarId: string) => CalendarShimRecord

type CalendarRecord = RecordTypes.CalendarRecord

export const getCalendarShimRecordInternal: (record: unknown) => CalendarSlot =
  getCalendarSlots

class _CalendarShimRecord implements CalendarRecord {
  declare readonly [RecordTypes.CalendarRecordBrand]: undefined

  toJSON() {
    return getCalendarSlotId(getCalendarShimRecordInternal(this))
  }

  valueOf() {
    return getCalendarSlotId(getCalendarShimRecordInternal(this))
  }
}

function setCalendarShimRecordInternal(
  instance: object,
  calendarSlot: CalendarSlot,
) {
  setCalendarSlots(instance, calendarSlot)
  attachDebugString(instance, calendarSlot, getCalendarSlotId)
}

export function createCalendarShimRecord(
  calendarSlot: CalendarSlot,
): CalendarShimRecord {
  const instance = Object.create(CalendarShimRecord.prototype)
  setCalendarShimRecordInternal(instance, calendarSlot)
  return instance
}

export type CalendarShimRecord = _CalendarShimRecord
export const CalendarShimRecord = defineTemporalClass(
  _CalendarShimRecord,
  'Calendar',
)

const isoCalendarRecord = createCalendarShimRecord(isoCalendar)
const gregoryCalendarRecord = createCalendarShimRecord(gregoryCalendar)
const getExoticCalendarRecord = memoize((calendarId: string) =>
  createCalendarShimRecord(getExoticCalendar(calendarId)),
)

// Function APIs accept an omitted calendar as ISO. Massage that not-defined
// public input into the internal ISO sentinel before the shared date logic runs.
export function refineCalendarShimArg(
  calendar?: CalendarShimRecord,
): CalendarSlot {
  return calendar === undefined
    ? isoCalendar
    : getCalendarShimRecordInternal(calendar)
}

// Adapt a public shim resolver (id -> CalendarShimRecord) into the internal
// CalendarResolver signature (id -> CalendarSlot) that the parser expects.
// The public resolver — typically getBasic or getAny — owns the
// iso/gregory/Intl policy, so all this wrapper does is brand-unwrap.
export function createCalendarShimStringResolver(
  getCalendar: CalendarShimResolver,
): CalendarResolver {
  return (calendarId: string) =>
    getCalendarShimRecordInternal(getCalendar(calendarId.toLowerCase()))
}

export function getIso(): CalendarShimRecord {
  return isoCalendarRecord
}

export function getGregory(): CalendarShimRecord {
  return gregoryCalendarRecord
}

export function getExotic(calendarId: string): CalendarShimRecord {
  return getExoticCalendarRecord(calendarId.toLowerCase())
}
