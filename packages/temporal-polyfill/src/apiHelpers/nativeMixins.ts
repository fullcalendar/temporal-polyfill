import type { DurationFields } from '../internal/durationFields'
import type {
  DateFields,
  DateStats,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
  YearMonthStats,
} from '../internal/fieldTypes'
import * as ShimMixins from './shimMixins'

type GetterMap<Slots, FieldName extends keyof Slots> = {
  [K in FieldName]: (slots: Slots) => any
}

function createNativeGetters<Slots, FieldName extends keyof Slots>(
  shimGetters: Record<FieldName, unknown>,
): GetterMap<Slots, FieldName> {
  const getters = {} as GetterMap<Slots, FieldName>
  for (const fieldName of Object.keys(shimGetters) as FieldName[]) {
    getters[fieldName] = ((slots: Slots) => slots[fieldName]) as GetterMap<
      Slots,
      FieldName
    >[typeof fieldName]
  }
  return getters
}

export const durationGetters = createNativeGetters<
  DurationFields,
  keyof DurationFields
>(ShimMixins.durationGetters)

export const timeGetters = createNativeGetters<TimeFields, keyof TimeFields>(
  ShimMixins.timeGetters,
)

export const yearMonthFieldGetters = createNativeGetters<
  YearMonthFields,
  keyof YearMonthFields
>(ShimMixins.yearMonthFieldGetters)

export const dateFieldGetters = createNativeGetters<
  DateFields,
  keyof DateFields
>(ShimMixins.dateFieldGetters)

export const monthDayFieldGetters = createNativeGetters<
  Pick<MonthDayFields, 'monthCode' | 'day'>,
  'monthCode' | 'day'
>(ShimMixins.monthDayFieldGetters)

export const yearMonthDerivedGetters = createNativeGetters<
  YearMonthStats,
  keyof YearMonthStats
>(ShimMixins.yearMonthDerivedGetters)

export const dateDerivedGetters = createNativeGetters<
  DateStats,
  keyof DateStats
>(ShimMixins.dateDerivedGetters)
