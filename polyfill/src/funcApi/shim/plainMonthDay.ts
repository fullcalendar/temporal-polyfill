import type { Temporal as TemporalSpec } from 'temporal-spec'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { monthDayFieldGetters } from '../../apiHelpers/shimMixins'
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toIntegerWithTrunc } from '../../internal/cast'
import { plainMonthDaysEqual } from '../../internal/compare'
import { convertPlainMonthDayToDate } from '../../internal/convert'
import { refinePlainMonthDayObjectLike } from '../../internal/createFromFields'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import {
  CalendarDateFields,
  EraYearOrYear,
  MonthDayFields,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformMonthDayOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import {
  isoEpochFirstLeapYear,
  validateIsoDateFields,
} from '../../internal/isoCalendarMath'
import {
  formatMonthDayIsoAuto,
  formatPlainMonthDayIso,
} from '../../internal/isoFormat'
import { parsePlainMonthDay } from '../../internal/isoParse'
import { mergePlainMonthDayFields } from '../../internal/merge'
import { createDateSlots } from '../../internal/slots'
import { checkIsoDateInBounds } from '../../internal/temporalLimits'
import { DateTimeFormatLike } from '../commonTypes'
import { PlainMonthDayRecordBranding } from '../recordBranding'
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
import { validateBag } from './temporalRecords'

type Format = DateTimeFormatLike<ShimPlainMonthDayRecord>
type ShimPlainMonthDaySlots = CalendarDateFields & { calendar: CalendarImpl }

export const getShimPlainMonthDaySlots: (
  record: unknown,
) => ShimPlainMonthDaySlots = getPlainMonthDaySlots

export type ShimPlainMonthDayRecord = InstanceType<
  typeof ShimPlainMonthDayRecord
> &
  RecordTypes.PlainMonthDayRecord

export const ShimPlainMonthDayRecord = defineTemporalClass(
  PlainMonthDayRecordBranding,
  class {
    declare readonly [RecordTypes.PlainMonthDayRecordBrand]: undefined

    get calendarId() {
      return getCalendarSlotId(getShimPlainMonthDaySlots(this).calendar)
    }

    toJSON() {
      return formatMonthDayIsoAuto(getShimPlainMonthDaySlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  getShimPlainMonthDaySlots,
  monthDayFieldGetters,
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
  calendar?: RecordTypes.CalendarRecord,
  referenceIsoYear?: number,
): ShimPlainMonthDayRecord {
  const isoMonthInt = toIntegerWithTrunc(isoMonth)
  const isoDayInt = toIntegerWithTrunc(isoDay)
  const calendarImpl = refineShimCalendarArgMaybe(calendar)
  const isoYearInt = toIntegerWithTrunc(
    referenceIsoYear ?? isoEpochFirstLeapYear,
  )
  const fields = checkIsoDateInBounds(
    validateIsoDateFields({
      year: isoYearInt,
      month: isoMonthInt,
      day: isoDayInt,
    }),
  )
  return createShimPlainMonthDayRecord(createDateSlots(fields, calendarImpl))
}

export function fromFields(
  fields: Partial<MonthDayFields & { calendar: RecordTypes.CalendarRecord }>,
  options?: TemporalSpec.OverflowOptions,
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
  getCalendarRecord: (id: string) => RecordTypes.CalendarRecord,
): ShimPlainMonthDayRecord {
  return createShimPlainMonthDayRecord(
    parsePlainMonthDay(s, createShimCalendarStringResolver(getCalendarRecord)),
  )
}

export function withFields(
  record: ShimPlainMonthDayRecord,
  mod: Partial<MonthDayFields>,
  options?: TemporalSpec.OverflowOptions,
): ShimPlainMonthDayRecord {
  const slots = getShimPlainMonthDaySlots(record)
  const resSlots = mergePlainMonthDayFields(slots, validateBag(mod), options)
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
    applyPlainFormatTimeZone(transformMonthDayOptions(options)),
  )
  checkResolvedCalendarCompatible(format, slots, true)
  return format.format(isoDateToEpochMilli(slots))
}

export function toString(
  record: ShimPlainMonthDayRecord,
  options?: TemporalSpec.PlainDateToStringOptions,
): string {
  return formatPlainMonthDayIso(getShimPlainMonthDaySlots(record), options)
}

export function toBasicString(record: ShimPlainMonthDayRecord): string {
  return formatMonthDayIsoAuto(getShimPlainMonthDaySlots(record))
}

export function toPlainDate(
  record: ShimPlainMonthDayRecord,
  fields: EraYearOrYear,
): ShimPlainDateRecord {
  const slots = getShimPlainMonthDaySlots(record)
  const resSlots = convertPlainMonthDayToDate(slots.calendar, record, fields)
  return createShimPlainDateRecord(resSlots)
}

// Type the bare global `Temporal` value (module-scoped, NOT `declare global`,
// so it never leaks into a consumer's environment). Lets `toTemporal` build via
// `new Temporal.PlainMonthDay(...)` — smaller than `globalThis.Temporal`, read lazily.
declare const Temporal: { PlainMonthDay: TemporalSpec.PlainMonthDayConstructor }

export function toTemporal(
  record: ShimPlainMonthDayRecord,
): TemporalSpec.PlainMonthDay {
  const slots = getShimPlainMonthDaySlots(record)
  return new Temporal.PlainMonthDay(
    slots.month,
    slots.day,
    getCalendarSlotId(slots.calendar),
    slots.year,
  )
}
