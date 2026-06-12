import type { Temporal } from 'temporal-spec'
import { PlainMonthDayBranding } from '../../apiHelpers/branding'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import {
  computeCalendarDateFields,
  computeCalendarMonthCode,
} from '../../internal/calendarDerived'
import { getCalendarSlotId } from '../../internal/calendarImpl'
import { plainMonthDaysEqual } from '../../internal/compare'
import { constructMonthDaySlots } from '../../internal/construct'
import { convertPlainMonthDayToDate } from '../../internal/convert'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import { EraYearOrYear, MonthDayFields } from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformMonthDayOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import {
  formatMonthDayIsoAuto,
  formatPlainMonthDayIso,
} from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainMonthDaySlots,
  setPlainMonthDaySlots,
} from '../temporalRecords'
import {
  createShimCalendarStringResolver,
  refineShimCalendarArgMaybe,
} from './calendarResolve'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import { ShimPlainDateRecord, createShimPlainDateRecord } from './plainDate'
import { rejectInvalidBag } from './temporalRecords'

type Format = DateTimeFormatLike<ShimPlainMonthDayRecord>
type ShimPlainMonthDaySlots = ReturnType<typeof constructMonthDaySlots>

export const getShimPlainMonthDaySlots: (
  record: unknown,
) => ShimPlainMonthDaySlots = getPlainMonthDaySlots

export type ShimPlainMonthDayRecord = InstanceType<
  typeof ShimPlainMonthDayRecord
> &
  RecordTypes.PlainMonthDayRecord
export const ShimPlainMonthDayRecord = defineTemporalClass(
  PlainMonthDayBranding,
  class implements Pick<MonthDayFields, 'monthCode' | 'day'> {
    declare readonly [RecordTypes.PlainMonthDayRecordBrand]: undefined

    get calendarId() {
      return getCalendarSlotId(getShimPlainMonthDaySlots(this).calendar)
    }

    get monthCode() {
      const slots = getShimPlainMonthDaySlots(this)
      return computeCalendarMonthCode(slots.calendar, slots)
    }

    get day() {
      const slots = getShimPlainMonthDaySlots(this)
      return computeCalendarDateFields(slots.calendar, slots).day
    }

    toJSON() {
      return formatMonthDayIsoAuto(getShimPlainMonthDaySlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
)

export function createShimPlainMonthDayRecord(
  slots: ShimPlainMonthDaySlots,
): ShimPlainMonthDayRecord {
  const instance = Object.create(ShimPlainMonthDayRecord.prototype)
  setPlainMonthDaySlots(instance, slots)
  attachDebugString(instance)
  return instance
}

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
  referenceIsoYear?: number,
): ShimPlainMonthDayRecord {
  return createShimPlainMonthDayRecord(
    constructMonthDaySlots(
      refineShimCalendarArgMaybe,
      isoMonth,
      isoDay,
      calendar,
      referenceIsoYear,
    ),
  )
}

export function fromFields(
  fields: Partial<MonthDayFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): ShimPlainMonthDayRecord {
  const inputCalendar = fields.calendar
  const calendarImpl = refineShimCalendarArgMaybe(inputCalendar)
  const resSlots = refinePlainMonthDayObjectLike(
    calendarImpl,
    !inputCalendar,
    fields as any,
    options,
  )
  return createShimPlainMonthDayRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): ShimPlainMonthDayRecord {
  return createShimPlainMonthDayRecord(
    parsePlainMonthDay(s, createShimCalendarStringResolver(getCalendarRecord)),
  )
}

export function withFields(
  record: ShimPlainMonthDayRecord,
  mod: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): ShimPlainMonthDayRecord {
  const slots = getShimPlainMonthDaySlots(record)
  const resSlots = mergePlainMonthDayFields(
    slots,
    rejectInvalidBag(mod),
    options,
  )
  return createShimPlainMonthDayRecord(resSlots)
}

export function equals(
  record: ShimPlainMonthDayRecord,
  otherRecord: ShimPlainMonthDayRecord,
): boolean {
  const slots = getShimPlainMonthDaySlots(record)
  const otherSlots = getShimPlainMonthDaySlots(otherRecord)
  return plainMonthDaysEqual(slots, otherSlots)
}

export function toPlainDate(
  record: ShimPlainMonthDayRecord,
  fields: EraYearOrYear,
): ShimPlainDateRecord {
  const slots = getShimPlainMonthDaySlots(record)
  const resSlots = convertPlainMonthDayToDate(slots.calendar, record, fields)
  return createShimPlainDateRecord(resSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<ShimPlainMonthDayRecord>(
  (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getShimPlainMonthDaySlots(record)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots, true)
      return [format, isoDateToEpochMilli(slots)]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getShimPlainMonthDaySlots(record0)
      const slots1 = getShimPlainMonthDaySlots(record1)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots0, true)
      checkResolvedCalendarCompatible(format, slots1, true)
      return [format, isoDateToEpochMilli(slots0), isoDateToEpochMilli(slots1)]
    },
  }),
  (options) =>
    applyPlainFormatTimeZone(
      transformMonthDayOptions(options, /* allowPartialOverlap = */ true),
    ),
)

export function toLocaleString(
  record: ShimPlainMonthDayRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimPlainMonthDaySlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(
      transformMonthDayOptions(options, /* allowPartialOverlap = */ false),
    ),
  )
  checkResolvedCalendarCompatible(format, slots, true)
  return format.format(isoDateToEpochMilli(slots))
}

export function toString(
  record: ShimPlainMonthDayRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return formatPlainMonthDayIso(getShimPlainMonthDaySlots(record), options)
}

export function toBasicString(record: ShimPlainMonthDayRecord): string {
  return formatMonthDayIsoAuto(getShimPlainMonthDaySlots(record))
}
