import type { DurationFields } from '../internal/durationFields'
import type {
  DateFields,
  DateStats,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
  YearMonthStats,
} from '../internal/fieldTypes'
import { createPropGetters } from '../internal/utils'
import * as ShimMixins from './shimMixins'

function createNativeGetters<Slots>(
  shimGetters: Partial<Record<keyof Slots, unknown>>,
) {
  return createPropGetters<Slots, keyof Slots>(
    Object.keys(shimGetters) as (keyof Slots)[],
  )
}

export const durationGetters = createNativeGetters<DurationFields>(
  ShimMixins.durationGetters,
)

export const timeGetters = createNativeGetters<TimeFields>(
  ShimMixins.timeGetters,
)

export const yearMonthFieldGetters = createNativeGetters<YearMonthFields>(
  ShimMixins.yearMonthFieldGetters,
)

export const dateFieldGetters = createNativeGetters<DateFields>(
  ShimMixins.dateFieldGetters,
)

export const monthDayFieldGetters = createNativeGetters<
  Pick<MonthDayFields, 'monthCode' | 'day'>
>(ShimMixins.monthDayFieldGetters)

export const yearMonthDerivedGetters = createNativeGetters<YearMonthStats>(
  ShimMixins.yearMonthDerivedGetters,
)

export const dateDerivedGetters = createNativeGetters<DateStats>(
  ShimMixins.dateDerivedGetters,
)
