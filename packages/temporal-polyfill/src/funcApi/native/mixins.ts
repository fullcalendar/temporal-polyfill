import {
  type DurationFields,
  durationFieldNamesAsc,
} from '../../internal/durationFields'
import {
  allYearFieldNames,
  monthFieldNames,
  timeFieldNamesAsc,
} from '../../internal/fieldNames'
import type {
  DateFields,
  DateStats,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
  YearMonthStats,
} from '../../internal/fieldTypes'

type GetterMap<Slots, FieldName extends keyof Slots> = {
  [K in FieldName]: (slots: Slots) => any
}

function createNativeGetters<Slots, FieldName extends keyof Slots>(
  fieldNames: readonly FieldName[],
): GetterMap<Slots, FieldName> {
  const getters = {} as GetterMap<Slots, FieldName>
  for (const fieldName of fieldNames) {
    getters[fieldName] = ((slots: Slots) => slots[fieldName]) as GetterMap<
      Slots,
      FieldName
    >[typeof fieldName]
  }
  return getters
}

const yearMonthFieldNames = [...allYearFieldNames, ...monthFieldNames] as const
const dateFieldNames = [...yearMonthFieldNames, 'day'] as const
const monthDayFieldNames = [...monthFieldNames, 'day'] as const
const monthCodeDayFieldNames = ['monthCode', 'day'] as const

const yearMonthStatNames = [
  'daysInMonth',
  'daysInYear',
  'monthsInYear',
  'inLeapYear',
] as const

const dateStatNames = [
  'dayOfWeek',
  'dayOfYear',
  'weekOfYear',
  'yearOfWeek',
  'daysInWeek',
  ...yearMonthStatNames,
] as const

export const durationGetters = createNativeGetters<
  DurationFields,
  keyof DurationFields
>(durationFieldNamesAsc)

export const timeGetters = createNativeGetters<TimeFields, keyof TimeFields>(
  timeFieldNamesAsc,
)

export const yearMonthFieldGetters = createNativeGetters<
  YearMonthFields,
  keyof YearMonthFields
>(yearMonthFieldNames)

export const dateFieldGetters = createNativeGetters<
  DateFields,
  keyof DateFields
>(dateFieldNames)

export const monthDayFieldGetters = createNativeGetters<
  MonthDayFields,
  keyof MonthDayFields
>(monthDayFieldNames)

export const monthCodeDayFieldGetters = createNativeGetters<
  Pick<MonthDayFields, 'monthCode' | 'day'>,
  'monthCode' | 'day'
>(monthCodeDayFieldNames)

export const yearMonthDerivedGetters = createNativeGetters<
  YearMonthStats,
  keyof YearMonthStats
>(yearMonthStatNames)

export const dateDerivedGetters = createNativeGetters<
  DateStats,
  keyof DateStats
>(dateStatNames)
