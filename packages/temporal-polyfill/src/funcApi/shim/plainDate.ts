import { calendarIdGetters, dateFieldGetters } from '../../classApi/mixins'
import { createSlotClass, rejectInvalidBag } from '../../classApi/slotClass'
import { computeCalendarDayOfYear } from '../../internal/calendarDerived'
import { plainDatesEqual } from '../../internal/compare'
import { constructDateSlots } from '../../internal/construct'
import { refinePlainDateObjectLike } from '../../internal/createFromFields'
import { diffPlainDates, getCommonCalendar } from '../../internal/diff'
import { isoCalendar } from '../../internal/externalCalendar'
import { DateFields } from '../../internal/fieldTypes'
import { formatPlainDateIso } from '../../internal/isoFormat'
import { mergePlainDateFields } from '../../internal/merge'
import { movePlainDate } from '../../internal/move'
import { DiffOptions, OverflowOptions } from '../../internal/optionsModel'
import { createDateSlots } from '../../internal/slots'
import { DateUnitName } from '../../internal/units'
import { PlainDateRecordBranding } from '../common-branding'
import { CalendarShimRecord, getCalendarShimRecordInternal } from './calendar'
import {
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'

export type PlainDateShimRecord = any & DateFields

export const [
  PlainDateShimRecord,
  createPlainDateShimRecord,
  getPlainDateShimRecordSlots,
] = createSlotClass(
  PlainDateRecordBranding,
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarShimRecord,
  ) => {
    return constructDateSlots(
      isoYear,
      isoMonth,
      isoDay,
      // TODO: update constructDateSlots to accept InternalCalenar directly,
      // not a string calenarId that needs to be refined
      calendar === undefined
        ? undefined
        : (getCalendarShimRecordInternal(calendar) as any), // !!!
    )
  },
  formatPlainDateIso,
  {
    ...calendarIdGetters,
    ...dateFieldGetters,
  },
  {},
  {},
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
): PlainDateShimRecord {
  return new PlainDateShimRecord(isoYear, isoMonth, isoDay, calendar)
}

export function fromFields(
  fields: Partial<DateFields> & { calendar: CalendarShimRecord },
  options?: OverflowOptions,
): PlainDateShimRecord {
  const inputCalendar = fields.calendar
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  // already proper slots
  const resSlots = refinePlainDateObjectLike(internalCalendar, fields, options)
  return createPlainDateShimRecord(resSlots)
}

export function withCalendar(
  record: PlainDateShimRecord,
  inputCalendar: CalendarShimRecord,
): PlainDateShimRecord {
  const slots = getPlainDateShimRecordSlots(record)
  const internalCalendar = inputCalendar
    ? getCalendarShimRecordInternal(inputCalendar)
    : isoCalendar
  return createDateSlots(slots, internalCalendar)
}

export function withFields(
  record: PlainDateShimRecord,
  mod: Partial<DateFields>,
  options?: OverflowOptions,
) {
  const slots = getPlainDateShimRecordSlots(record)
  // already proper slots
  const resSlots = mergePlainDateFields(slots, rejectInvalidBag(mod), options)
  return createPlainDateShimRecord(resSlots)
}

export function dayOfYear(record: PlainDateShimRecord) {
  const slots = getPlainDateShimRecordSlots(record)
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function add(
  record: PlainDateShimRecord,
  durationRecord: any,
  options?: OverflowOptions,
) {
  const slots = getPlainDateShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDate(false, slots, durationSlots, options)
  return createPlainDateShimRecord(resSlots)
}

export function subtract(
  record: PlainDateShimRecord,
  durationRecord: any,
  options?: OverflowOptions,
) {
  const slots = getPlainDateShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  // already proper slots
  const resSlots = movePlainDate(true, slots, durationSlots, options)
  return createPlainDateShimRecord(resSlots)
}

export function until(
  record: PlainDateShimRecord,
  otherRecord: PlainDateShimRecord,
  options?: DiffOptions<DateUnitName>,
) {
  const slots = getPlainDateShimRecordSlots(record)
  const otherSlots = getPlainDateShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDates(false, calendar, slots, otherSlots, options)
  return createDurationShimRecord(resSlots)
}

export function since(
  record: PlainDateShimRecord,
  otherRecord: PlainDateShimRecord,
  options?: DiffOptions<DateUnitName>,
) {
  const slots = getPlainDateShimRecordSlots(record)
  const otherSlots = getPlainDateShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainDates(true, calendar, slots, otherSlots, options)
  return createDurationShimRecord(resSlots)
}

export function equals(
  record: PlainDateShimRecord,
  otherRecord: PlainDateShimRecord,
): boolean {
  const slots = getPlainDateShimRecordSlots(record)
  const otherSlots = getPlainDateShimRecordSlots(otherRecord)
  return plainDatesEqual(slots, otherSlots)
}
