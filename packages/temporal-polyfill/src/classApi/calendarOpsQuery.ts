import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import {
  AdapterCompoundOps,
  createAdapterCompoundOps,
  dateModAdapters,
  dateRefineAdapters,
  diffAdapters,
  monthDayModAdapters,
  monthDayRefineAdapters,
  moveAdapters,
  yearMonthDiffAdapters,
  yearMonthModAdapters,
  yearMonthMoveAdapters,
  yearMonthRefineAdapters,
} from './calendarAdapter'
import { CalendarSlot } from './slotClass'

// Refine
export const createYearMonthRefineOps = createCompoundOpsCreator(
  yearMonthRefineAdapters,
)
export const createDateRefineOps = createCompoundOpsCreator(dateRefineAdapters)
export const createMonthDayRefineOps = createCompoundOpsCreator(
  monthDayRefineAdapters,
)

// Mod
export const createYearMonthModOps =
  createCompoundOpsCreator(yearMonthModAdapters)
export const createDateModOps = createCompoundOpsCreator(dateModAdapters)
export const createMonthDayModOps =
  createCompoundOpsCreator(monthDayModAdapters)

// Math
export const createMoveOps = createCompoundOpsCreator(moveAdapters)
export const createDiffOps = createCompoundOpsCreator(diffAdapters)
export const createYearMonthMoveOps = createCompoundOpsCreator(
  yearMonthMoveAdapters,
)
export const createYearMonthDiffOps = createCompoundOpsCreator(
  yearMonthDiffAdapters,
)

// -----------------------------------------------------------------------------

function createCompoundOpsCreator<KV extends {}>(
  adapterFuncs: KV,
): (calendarSlot: CalendarSlot) => AdapterCompoundOps<KV> {
  return (calendarSlot) => {
    if (typeof calendarSlot === 'string') {
      return createNativeStandardOps(calendarSlot) as any // has everything
    }
    return createAdapterCompoundOps(calendarSlot, adapterFuncs)
  }
}
