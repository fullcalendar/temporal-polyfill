import type { DurationFields } from '../internal/durationFields'
import type {
  DateFields,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
} from '../internal/fieldTypes'
import { createPropGetters } from '../internal/utils'
import * as SlotGetters from './gettersForSlots'

// Used only by funcApi/native. These property-forwarding getters are keyed off
// the slot-backed tables via Object.keys, requiring this runtime import.

function createNativeGetters<Slots>(
  shimGetters: Partial<Record<keyof Slots, unknown>>,
) {
  return createPropGetters<Slots, keyof Slots>(
    Object.keys(shimGetters) as (keyof Slots)[],
  )
}

export const durationGetters = createNativeGetters<DurationFields>(
  SlotGetters.durationGetters,
)

export const timeGetters = createNativeGetters<TimeFields>(
  SlotGetters.timeGetters,
)

export const yearMonthFieldGetters = createNativeGetters<YearMonthFields>(
  SlotGetters.yearMonthFieldGetters,
)

export const dateFieldGetters = createNativeGetters<DateFields>(
  SlotGetters.dateFieldGetters,
)

export const monthDayFieldGetters = createNativeGetters<
  Pick<MonthDayFields, 'monthCode' | 'day'>
>(SlotGetters.monthDayFieldGetters)
