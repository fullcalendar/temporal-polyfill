import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from '../../apiHelpers/classStyle'
import { yearMonthFieldGetters } from '../../apiHelpers/shimMixins'
import {
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarInLeapYear,
  computeCalendarMonthsInYear,
} from '../../internal/calendarDerived'
import { CalendarImpl, getCalendarSlotId } from '../../internal/calendarImpl'
import { toIntegerWithTrunc, toStrictInteger } from '../../internal/cast'
import {
  compareIsoDateFields,
  plainYearMonthsEqual,
} from '../../internal/compare'
import { convertPlainYearMonthToDate } from '../../internal/convert'
import { refinePlainYearMonthObjectLike } from '../../internal/createFromFields'
import { diffPlainYearMonth } from '../../internal/diff'
import { durationFieldDefaults } from '../../internal/durationFields'
import { validateDurationFields } from '../../internal/durationMath'
import { isoDateToEpochMilli } from '../../internal/epochMath'
import {
  CalendarDateFields,
  DayFields,
  YearMonthFields,
} from '../../internal/fieldTypes'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../../internal/intlFormatArgs'
import { transformYearMonthOptions } from '../../internal/intlFormatOptions'
import { LocalesArg, RawDateTimeFormat } from '../../internal/intlFormatUtils'
import { validateIsoDateFields } from '../../internal/isoCalendarMath'
import {
  formatPlainYearMonthIso,
  formatYearMonthIsoAuto,
} from '../../internal/isoFormat'
import { parsePlainYearMonth } from '../../internal/isoParse'
import { mergePlainYearMonthFields } from '../../internal/merge'
import { moveYearMonth } from '../../internal/move'
import { getCommonCalendar } from '../../internal/slotUtils'
import { createDateSlots, createDurationSlots } from '../../internal/slots'
import { checkIsoYearMonthInBounds } from '../../internal/temporalLimits'
import { Unit } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike } from '../commonTypes'
import { PlainYearMonthRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainYearMonthSlots,
  setPlainYearMonthSlots,
} from '../temporalRecords'
import {
  createShimCalendarStringResolver,
  refineShimCalendarArgMaybe,
} from './calendarResolve'
import { createDateTimeFormatFactory } from './dateTimeFormat'
import { diffPlainMonths, diffPlainYears } from './diffUtils'
import {
  ShimDurationRecord,
  createShimDurationRecord,
  getShimDurationSlots,
} from './duration'
import { reversedMove } from './moveUtils'
import { ShimPlainDateRecord, createShimPlainDateRecord } from './plainDate'
import { refineRoundToOptions } from './roundUtils'
import {
  computeYearCeil,
  computeYearFloor,
  computeYearInterval,
  roundDateToInterval,
} from './roundUtils'
import { validateBag } from './temporalRecords'

type Format = DateTimeFormatLike<ShimPlainYearMonthRecord>
type ShimPlainYearMonthSlots = CalendarDateFields & { calendar: CalendarImpl }

export const getShimPlainYearMonthSlots: (
  record: unknown,
) => ShimPlainYearMonthSlots = getPlainYearMonthSlots

export type ShimPlainYearMonthRecord = InstanceType<
  typeof ShimPlainYearMonthRecord
> &
  RecordTypes.PlainYearMonthRecord

export const ShimPlainYearMonthRecord = defineTemporalClass(
  PlainYearMonthRecordBranding,
  class {
    declare readonly [RecordTypes.PlainYearMonthRecordBrand]: undefined

    get calendarId() {
      return getCalendarSlotId(getShimPlainYearMonthSlots(this).calendar)
    }

    toJSON() {
      return formatYearMonthIsoAuto(getShimPlainYearMonthSlots(this))
    }

    valueOf(): never {
      return forbiddenValueOf()
    }
  },
  getShimPlainYearMonthSlots,
  yearMonthFieldGetters,
)

export function createShimPlainYearMonthRecord(
  slots: ShimPlainYearMonthSlots,
): ShimPlainYearMonthRecord {
  const instance = Object.create(ShimPlainYearMonthRecord.prototype)
  setPlainYearMonthSlots(instance, slots)
  attachDebugString(instance)
  return instance
}

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarRecord,
  referenceIsoDay?: number,
): ShimPlainYearMonthRecord {
  const isoYearInt = toIntegerWithTrunc(isoYear)
  const isoMonthInt = toIntegerWithTrunc(isoMonth)
  const calendarImpl = refineShimCalendarArgMaybe(calendar)
  const isoDayInt = toIntegerWithTrunc(referenceIsoDay ?? 1)
  const fields = checkIsoYearMonthInBounds(
    validateIsoDateFields({
      year: isoYearInt,
      month: isoMonthInt,
      day: isoDayInt,
    }),
  )
  return createShimPlainYearMonthRecord(createDateSlots(fields, calendarImpl))
}

export function fromFields(
  fields: Partial<YearMonthFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): ShimPlainYearMonthRecord {
  const calendarImpl = refineShimCalendarArgMaybe(fields.calendar)
  const resSlots = refinePlainYearMonthObjectLike(
    calendarImpl,
    fields as any,
    options,
  )
  return createShimPlainYearMonthRecord(resSlots)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): ShimPlainYearMonthRecord {
  return createShimPlainYearMonthRecord(
    parsePlainYearMonth(s, createShimCalendarStringResolver(getCalendarRecord)),
  )
}

export function daysInMonth(record: ShimPlainYearMonthRecord): number {
  const slots = getShimPlainYearMonthSlots(record)
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function daysInYear(record: ShimPlainYearMonthRecord): number {
  const slots = getShimPlainYearMonthSlots(record)
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function monthsInYear(record: ShimPlainYearMonthRecord): number {
  const slots = getShimPlainYearMonthSlots(record)
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function inLeapYear(record: ShimPlainYearMonthRecord): boolean {
  const slots = getShimPlainYearMonthSlots(record)
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function withFields(
  record: ShimPlainYearMonthRecord,
  mod: Partial<YearMonthFields>,
  options?: Temporal.OverflowOptions,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const resSlots = mergePlainYearMonthFields(slots, validateBag(mod), options)
  return createShimPlainYearMonthRecord(resSlots)
}

export function add(
  record: ShimPlainYearMonthRecord,
  durationRecord: ShimDurationRecord,
  options?: Temporal.OverflowOptions,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createDateSlots(
    moveYearMonth(false, slots.calendar, slots, durationSlots, options),
    slots.calendar,
  )
  return createShimPlainYearMonthRecord(resSlots)
}

export function subtract(
  record: ShimPlainYearMonthRecord,
  durationRecord: ShimDurationRecord,
  options?: Temporal.OverflowOptions,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const durationSlots = getShimDurationSlots(durationRecord)
  const resSlots = createDateSlots(
    moveYearMonth(true, slots.calendar, slots, durationSlots, options),
    slots.calendar,
  )
  return createShimPlainYearMonthRecord(resSlots)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: ShimPlainYearMonthRecord,
  otherRecord: ShimPlainYearMonthRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>,
): ShimDurationRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const otherSlots = getShimPlainYearMonthSlots(otherRecord)
  const calendar = getCommonCalendar(slots.calendar, otherSlots.calendar)
  const resSlots = diffPlainYearMonth(
    false,
    calendar,
    slots,
    otherSlots,
    options,
  )
  return createShimDurationRecord(resSlots)
}

export function equals(
  record: ShimPlainYearMonthRecord,
  otherRecord: ShimPlainYearMonthRecord,
): boolean {
  const slots = getShimPlainYearMonthSlots(record)
  const otherSlots = getShimPlainYearMonthSlots(otherRecord)
  return plainYearMonthsEqual(slots, otherSlots)
}

export function compare(
  record: ShimPlainYearMonthRecord,
  otherRecord: ShimPlainYearMonthRecord,
): NumberSign {
  const slots = getShimPlainYearMonthSlots(record)
  const otherSlots = getShimPlainYearMonthSlots(otherRecord)
  return compareIsoDateFields(slots, otherSlots)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createDateTimeFormatFactory<ShimPlainYearMonthRecord>(
  (internals) => ({
    getArgsForSingle: (record) => {
      const slots = getShimPlainYearMonthSlots(record)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots, true)
      return [format, isoDateToEpochMilli(slots)]
    },
    getArgsForRange: (record0, record1) => {
      const slots0 = getShimPlainYearMonthSlots(record0)
      const slots1 = getShimPlainYearMonthSlots(record1)
      const format = internals.baseFormat
      checkResolvedCalendarCompatible(format, slots0, true)
      checkResolvedCalendarCompatible(format, slots1, true)
      return [format, isoDateToEpochMilli(slots0), isoDateToEpochMilli(slots1)]
    },
  }),
  (options) =>
    applyPlainFormatTimeZone(
      transformYearMonthOptions(options, /* allowPartialOverlap = */ true),
    ),
)

export function toLocaleString(
  record: ShimPlainYearMonthRecord,
  locales: LocalesArg | undefined = undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const slots = getShimPlainYearMonthSlots(record)
  const format = new RawDateTimeFormat(
    locales,
    applyPlainFormatTimeZone(transformYearMonthOptions(options)),
  )
  checkResolvedCalendarCompatible(format, slots, true)
  return format.format(isoDateToEpochMilli(slots))
}

export function toString(
  record: ShimPlainYearMonthRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return formatPlainYearMonthIso(getShimPlainYearMonthSlots(record), options)
}

export function toBasicString(record: ShimPlainYearMonthRecord): string {
  return formatYearMonthIsoAuto(getShimPlainYearMonthSlots(record))
}

export function toPlainDate(
  record: ShimPlainYearMonthRecord,
  fields: DayFields,
): ShimPlainDateRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const resSlots = convertPlainYearMonthToDate(slots.calendar, record, fields)
  return createShimPlainDateRecord(resSlots)
}

export function toNative(
  record: ShimPlainYearMonthRecord,
): Temporal.PlainYearMonth {
  const slots = getShimPlainYearMonthSlots(record)
  return new NativeTemporal!.PlainYearMonth(
    slots.year,
    slots.month,
    getCalendarSlotId(slots.calendar),
    slots.day,
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: ShimPlainYearMonthRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const resSlots = createDateSlots(
    moveYearMonth(
      false,
      slots.calendar,
      slots,
      createDurationSlots(
        validateDurationFields({
          ...durationFieldDefaults,
          years: toStrictInteger(years),
        }),
      ),
      options,
    ),
    slots.calendar,
  )
  return createShimPlainYearMonthRecord(resSlots)
}

export function addMonths(
  record: ShimPlainYearMonthRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const resSlots = createDateSlots(
    moveYearMonth(
      false,
      slots.calendar,
      slots,
      createDurationSlots(
        validateDurationFields({
          ...durationFieldDefaults,
          months: toStrictInteger(months),
        }),
      ),
      options,
    ),
    slots.calendar,
  )
  return createShimPlainYearMonthRecord(resSlots)
}

export const subtractYears: (
  record: ShimPlainYearMonthRecord,
  years: number,
  options?: Temporal.OverflowOptions,
) => ShimPlainYearMonthRecord = reversedMove(addYears)

export const subtractMonths: (
  record: ShimPlainYearMonthRecord,
  months: number,
  options?: Temporal.OverflowOptions,
) => ShimPlainYearMonthRecord = reversedMove(addMonths)

// Non-standard: Round
// -----------------------------------------------------------------------------

// Round against the calendar year interval, then rewrap the chosen boundary as
// a YearMonth record. The boundary carries a reference ISO day that keeps
// non-ISO calendars aligned with the same semantics as PlainDate rounding.
export function roundToYear(
  record: ShimPlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  const [, roundingMode] = refineRoundToOptions(Unit.Year, options)
  const roundedIsoDateTime = roundDateToInterval(
    computeYearInterval,
    slots.calendar,
    slots,
    roundingMode,
  )
  return createShimPlainYearMonthRecord(
    createDateSlots(roundedIsoDateTime, slots.calendar),
  )
}

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export function startOfYear(
  record: ShimPlainYearMonthRecord,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  return createShimPlainYearMonthRecord(
    createDateSlots(computeYearFloor(slots.calendar, slots), slots.calendar),
  )
}

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

// PlainYearMonth has month precision, so the inclusive end of the year is the
// month before the next calendar year's exclusive boundary.
export function endOfYear(
  record: ShimPlainYearMonthRecord,
): ShimPlainYearMonthRecord {
  const slots = getShimPlainYearMonthSlots(record)
  return createShimPlainYearMonthRecord(
    // move back a month
    createDateSlots(
      moveYearMonth(
        true,
        slots.calendar,
        computeYearCeil(slots.calendar, slots),
        createDurationSlots({
          ...durationFieldDefaults,
          months: 1,
        }),
      ),
      slots.calendar,
    ),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: ShimPlainYearMonthRecord,
  record1: ShimPlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainYears(
    getShimPlainYearMonthSlots(record0),
    getShimPlainYearMonthSlots(record1),
    options,
  )
}

export function diffMonths(
  record0: ShimPlainYearMonthRecord,
  record1: ShimPlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainMonths(
    getShimPlainYearMonthSlots(record0),
    getShimPlainYearMonthSlots(record1),
    options,
  )
}
