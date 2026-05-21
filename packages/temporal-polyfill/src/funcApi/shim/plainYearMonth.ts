import { calendarIdGetters, yearMonthGetters } from '../../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../../apiHelpers/slotClass'
import {
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarInLeapYear,
  computeCalendarMonthsInYear,
} from '../../internal/calendarDerived'
import {
  compareIsoDateFields,
  plainYearMonthsEqual,
} from '../../internal/compare'
import { constructYearMonthSlots } from '../../internal/construct'
import { convertPlainYearMonthToDate } from '../../internal/convert'
import { refinePlainYearMonthObjectLike } from '../../internal/createFromFields'
import { diffPlainYearMonth, getCommonCalendar } from '../../internal/diff'
import { DayFields, YearMonthFields } from '../../internal/fieldTypes'
import {
  createFormatPrepper,
  yearMonthConfig,
} from '../../internal/intlFormatPrep'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../../internal/isoFormat'
import { parsePlainYearMonth } from '../../internal/isoParse'
import { mergePlainYearMonthFields } from '../../internal/merge'
import { movePlainYearMonth } from '../../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { YearMonthUnitName } from '../../internal/units'
import { NumberSign, bindArgs } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import { PlainYearMonthRecordBranding } from '../recordBranding'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormat } from './dateTimeFormat'
import {
  DurationShimRecord,
  createDurationShimRecord,
  getDurationShimRecordSlots,
} from './duration'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'

export type PlainYearMonthShimRecord = any & YearMonthFields
type Format = DateTimeFormatLike<PlainYearMonthShimRecord>

export const [
  PlainYearMonthShimRecord,
  createPlainYearMonthShimRecord,
  getPlainYearMonthShimRecordSlots,
] = createSlotClass(
  PlainYearMonthRecordBranding,
  bindArgs(constructYearMonthSlots, refineCalendarShimArg),
  formatPlainYearMonthIso,
  {
    ...calendarIdGetters,
    ...yearMonthGetters,
  },
  {},
  {},
)

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarShimRecord,
  referenceIsoDay?: number,
): PlainYearMonthShimRecord {
  return new PlainYearMonthShimRecord(
    isoYear,
    isoMonth,
    calendar,
    referenceIsoDay,
  )
}

export function isRecord(arg: unknown): arg is PlainYearMonthShimRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === PlainYearMonthRecordBranding
}

export function fromFields(
  fields: Partial<YearMonthFields> & { calendar?: CalendarShimRecord },
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const calendarSlot = refineCalendarShimArg(fields.calendar)
  const resSlots = refinePlainYearMonthObjectLike(
    calendarSlot,
    fields as any,
    options,
  )
  return createPlainYearMonthShimRecord(resSlots)
}

export function fromString(
  s: string,
  resolveCalendar?: CalendarShimResolver,
): PlainYearMonthShimRecord {
  return createPlainYearMonthShimRecord(
    parsePlainYearMonth(s, createCalendarShimStringResolver(resolveCalendar)),
  )
}

export function daysInMonth(record: PlainYearMonthShimRecord): number {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: PlainYearMonthShimRecord): number {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: PlainYearMonthShimRecord): number {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: PlainYearMonthShimRecord): boolean {
  const slots = getPlainYearMonthShimRecordSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function withFields(
  record: PlainYearMonthShimRecord,
  mod: Partial<YearMonthFields>,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const resSlots = mergePlainYearMonthFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createPlainYearMonthShimRecord(resSlots)
}

export function add(
  record: PlainYearMonthShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainYearMonth(false, slots, durationSlots, options)
  return createPlainYearMonthShimRecord(resSlots)
}

export function subtract(
  record: PlainYearMonthShimRecord,
  durationRecord: DurationShimRecord,
  options?: OverflowOptions,
): PlainYearMonthShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const durationSlots = getDurationShimRecordSlots(durationRecord)
  const resSlots = movePlainYearMonth(true, slots, durationSlots, options)
  return createPlainYearMonthShimRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
  options?: DiffOptions<YearMonthUnitName>,
): DurationShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const otherSlots = getPlainYearMonthShimRecordSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainYearMonth(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createDurationShimRecord(resSlots)
}

export function equals(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
): boolean {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const otherSlots = getPlainYearMonthShimRecordSlots(otherRecord)
  return plainYearMonthsEqual(slots, otherSlots)
}

export function compare(
  record: PlainYearMonthShimRecord,
  otherRecord: PlainYearMonthShimRecord,
): NumberSign {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const otherSlots = getPlainYearMonthShimRecordSlots(otherRecord)
  return compareIsoDateFields(slots, otherSlots)
}

export function toPlainDate(
  record: PlainYearMonthShimRecord,
  fields: DayFields,
): PlainDateShimRecord {
  const slots = getPlainYearMonthShimRecordSlots(record)
  const resSlots = convertPlainYearMonthToDate(slots.calendar, record, fields)
  return createPlainDateShimRecord(resSlots)
}

const prepFormat = createFormatPrepper(yearMonthConfig)

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createDateTimeFormat(
    yearMonthConfig,
    getPlainYearMonthShimRecordSlots,
    locales,
    options,
  )
}

export function toLocaleString(
  record: PlainYearMonthShimRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(
    locales,
    options,
    getPlainYearMonthShimRecordSlots(record),
  )
  return format.format(epochMilli)
}

export function toString(
  record: PlainYearMonthShimRecord,
  options?: CalendarDisplayOptions,
): string {
  return formatPlainYearMonthIso(
    getPlainYearMonthShimRecordSlots(record),
    options,
  )
}
