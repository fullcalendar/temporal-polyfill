import { NativeStandardOps } from '../internal/calendarNative'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { AdapterSimpleOps, CompoundAdapterMethods, createAdapterSimpleOps, createCompoundAdapterOps, dateModAdapters, dateRefineAdapters, diffAdapters, monthDayModAdapters, monthDayRefineAdapters, moveAdapters, yearMonthDiffAdapters, yearMonthModAdapters, yearMonthMoveAdapters, yearMonthRefineAdapters } from './calendarAdapter'
import { CalendarSlot } from './calendarSlot'

// Refine
export const createYearMonthRefineOps = createCompoundOpsCreator(yearMonthRefineAdapters)
export const createDateRefineOps = createCompoundOpsCreator(dateRefineAdapters)
export const createMonthDayRefineOps = createCompoundOpsCreator(monthDayRefineAdapters)

// Mod
export const createYearMonthModOps = createCompoundOpsCreator(yearMonthModAdapters)
export const createDateModOps = createCompoundOpsCreator(dateModAdapters)
export const createMonthDayModOps = createCompoundOpsCreator(monthDayModAdapters)

// Math
export const createMoveOps = createCompoundOpsCreator(moveAdapters)
export const createDiffOps = createCompoundOpsCreator(diffAdapters)
export const createYearMonthMoveOps = createCompoundOpsCreator(yearMonthMoveAdapters)
export const createYearMonthDiffOps = createCompoundOpsCreator(yearMonthDiffAdapters)

// -------------------------------------------------------------------------------------------------

function createCompoundOpsCreator<KV extends {}>(
  adapterFuncs: KV,
): (
  (calendarSlot: CalendarSlot) => CompoundAdapterMethods<KV>
) {
  return (calendarSlot) => {
    if (typeof calendarSlot === 'string') {
      return createNativeStandardOps(calendarSlot) as any // has everything
    }
    return createCompoundAdapterOps(calendarSlot, adapterFuncs)
  }
}

export function createSimpleOps(calendarSlot: CalendarSlot): AdapterSimpleOps {
  if (typeof calendarSlot === 'string') {
    return createNativeStandardOps(calendarSlot) // has everything
  }
  return createAdapterSimpleOps(calendarSlot)
}
