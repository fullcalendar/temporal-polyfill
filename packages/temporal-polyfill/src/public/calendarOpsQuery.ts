import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { createAdapterSimpleOps, createCompoundAdapterOps, dateModAdapters, dateRefineAdapters, diffAdapters, monthDayModAdapters, monthDayRefineAdapters, moveAdapters, yearMonthModAdapters, yearMonthRefineAdapters } from './calendarAdapter'
import { CalendarSlot } from './calendarSlot'

// Math
export const createMoveOps = createCompoundOpsCreator(moveAdapters)
export const createDiffOps = createCompoundOpsCreator(diffAdapters)

// Refine
export const createYearMonthRefineOps = createCompoundOpsCreator(yearMonthRefineAdapters)
export const createDateRefineOps = createCompoundOpsCreator(dateRefineAdapters)
export const createMonthDayRefineOps = createCompoundOpsCreator(monthDayRefineAdapters)

// Mod
export const createYearMonthModOps = createCompoundOpsCreator(yearMonthModAdapters)
export const createDateModOps = createCompoundOpsCreator(dateModAdapters)
export const createMonthDayModOps = createCompoundOpsCreator(monthDayModAdapters)

// -------------------------------------------------------------------------------------------------

function createCompoundOpsCreator(complexAdapters: any): any {
  return (calendarSlot: CalendarSlot) => {
    if (typeof calendarSlot === 'string') {
      return createNativeStandardOps(calendarSlot) as any // TODO: cache?
    }
    return createCompoundAdapterOps(calendarSlot, complexAdapters)
  }
}

export function createSimpleOps(calendarSlot: CalendarSlot) {
  if (typeof calendarSlot === 'string') {
    return createNativeStandardOps(calendarSlot) // TODO: cache?
  }
  return createAdapterSimpleOps(calendarSlot)
}
