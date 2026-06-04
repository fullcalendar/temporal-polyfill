import type { Temporal } from 'temporal-spec'
import {
  computeCalendarDateFields,
  computeCalendarMonthCode,
} from '../../internal/calendarDerived'
import { getCalendarSlotId } from '../../internal/calendarSlot'
import { plainMonthDaysEqual } from '../../internal/compare'
import { constructMonthDaySlots } from '../../internal/construct'
import { convertPlainMonthDayToDate } from '../../internal/convert'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import { EraYearOrYear, MonthDayFields } from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
  strictPartialDateCalendarCheck,
} from '../../internal/intlFormatArgs'
import { transformMonthDayOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import {
  formatMonthDayIsoAuto,
  formatPlainMonthDayIso,
} from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainMonthDaySlots,
  setPlainMonthDaySlots,
} from '../temporalRecords'
import {
  CalendarShimRecord,
  CalendarShimResolver,
  createCalendarShimStringResolver,
  refineCalendarShimArg,
} from './calendar'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import { rejectInvalidBag } from './temporalRecords'

type PlainMonthDayRecord = RecordTypes.PlainMonthDayRecord

type Format = DateTimeFormatLike<PlainMonthDayShimRecord>

type PlainMonthDayShimSlots = ReturnType<typeof constructMonthDaySlots>

export const getPlainMonthDayShimRecordSlots: (
  record: unknown,
) => PlainMonthDayShimSlots = getPlainMonthDaySlots

class _PlainMonthDayShimRecord
  implements Pick<MonthDayFields, 'monthCode' | 'day'>, PlainMonthDayRecord
{
  declare readonly [RecordTypes.PlainMonthDayRecordBrand]: undefined

  get calendarId() {
    return getCalendarSlotId(getPlainMonthDayShimRecordSlots(this).calendar)
  }

  get monthCode() {
    const slots = getPlainMonthDayShimRecordSlots(this)
    return computeCalendarMonthCode(slots.calendar, slots)
  }

  get day() {
    const slots = getPlainMonthDayShimRecordSlots(this)
    return computeCalendarDateFields(slots.calendar, slots).day
  }

  toJSON() {
    return formatMonthDayIsoAuto(getPlainMonthDayShimRecordSlots(this))
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainMonthDayShimRecordSlots(
  instance: object,
  slots: PlainMonthDayShimSlots,
) {
  setPlainMonthDaySlots(instance, slots)
  attachDebugString(instance, slots, formatMonthDayIsoAuto)
}

export function createPlainMonthDayShimRecord(
  slots: PlainMonthDayShimSlots,
): PlainMonthDayShimRecord {
  const instance = Object.create(PlainMonthDayShimRecord.prototype)
  setPlainMonthDayShimRecordSlots(instance, slots)
  return instance
}

export type PlainMonthDayShimRecord = _PlainMonthDayShimRecord
export const PlainMonthDayShimRecord = defineTemporalClass(
  _PlainMonthDayShimRecord,
  'PlainMonthDay',
)

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarShimRecord,
  referenceIsoYear?: number,
): PlainMonthDayShimRecord {
  return createPlainMonthDayShimRecord(
    constructMonthDaySlots(
      refineCalendarShimArg,
      isoMonth,
      isoDay,
      calendar,
      referenceIsoYear,
    ),
  )
}

export function fromFields(
  fields: Partial<MonthDayFields> & { calendar?: CalendarShimRecord },
  options?: Temporal.OverflowOptions,
): PlainMonthDayShimRecord {
  const inputCalendar = fields.calendar
  const calendarSlot = refineCalendarShimArg(inputCalendar)
  const resSlots = refinePlainMonthDayObjectLike(
    calendarSlot,
    !inputCalendar,
    fields as any,
    options,
  )
  return createPlainMonthDayShimRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendar: CalendarShimResolver,
): PlainMonthDayShimRecord {
  return createPlainMonthDayShimRecord(
    parsePlainMonthDay(s, createCalendarShimStringResolver(getCalendar)),
  )
}

export function withFields(
  record: PlainMonthDayShimRecord,
  mod: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): PlainMonthDayShimRecord {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const resSlots = mergePlainMonthDayFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createPlainMonthDayShimRecord(resSlots)
}

export function equals(
  record: PlainMonthDayShimRecord,
  otherRecord: PlainMonthDayShimRecord,
): boolean {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const otherSlots = getPlainMonthDayShimRecordSlots(otherRecord)
  return plainMonthDaysEqual(slots, otherSlots)
}

export function toPlainDate(
  record: PlainMonthDayShimRecord,
  fields: EraYearOrYear,
): PlainDateShimRecord {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const resSlots = convertPlainMonthDayToDate(slots.calendar, record, fields)
  return createPlainDateShimRecord(resSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<PlainMonthDayShimRecord>({
  transformOptions: (options) =>
    applyPlainFormatTimeZone(
      transformMonthDayOptions(options, /* allowPartialOverlap = */ true),
    ),
  createArgsProvider: (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getPlainMonthDayShimRecordSlots(record)
      const format = internals.format
      checkResolvedCalendarCompatible(
        format,
        slots,
        strictPartialDateCalendarCheck,
      )
      return [format, isoDateToEpochMilli(slots)!]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getPlainMonthDayShimRecordSlots(record0)
      const slots1 = getPlainMonthDayShimRecordSlots(record1)
      const format = internals.format
      checkResolvedCalendarCompatible(
        format,
        slots0,
        strictPartialDateCalendarCheck,
      )
      checkResolvedCalendarCompatible(
        format,
        slots1,
        strictPartialDateCalendarCheck,
      )
      return [
        format,
        isoDateToEpochMilli(slots0)!,
        isoDateToEpochMilli(slots1)!,
      ]
    },
  }),
})

export function toLocaleString(
  record: PlainMonthDayShimRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getPlainMonthDayShimRecordSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(
      transformMonthDayOptions(options, /* allowPartialOverlap = */ false),
    ),
  )
  checkResolvedCalendarCompatible(format, slots, strictPartialDateCalendarCheck)
  return format.format(isoDateToEpochMilli(slots)!)
}

export function toString(
  record: PlainMonthDayShimRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return formatPlainMonthDayIso(
    getPlainMonthDayShimRecordSlots(record),
    options,
  )
}

export function toSimpleString(record: PlainMonthDayShimRecord): string {
  return formatMonthDayIsoAuto(getPlainMonthDayShimRecordSlots(record))
}
