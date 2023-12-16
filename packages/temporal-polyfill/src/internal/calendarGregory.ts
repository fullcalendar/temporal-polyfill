import { gregoryCalendarOrigins } from './calendarConfig'
import { isoDateModOps, isoDateRefineOps, isoMonthDayModOps, isoMonthDayRefineOps, isoPartOps, isoStandardOps, isoYearMonthModOps, isoYearMonthRefineOps } from './calendarIso'
import { EraParts, NativeDateModOps, NativeDateRefineOps, NativeMonthDayModOps, NativeMonthDayRefineOps, NativePartOps, NativeStandardOps, NativeYearMonthModOps, NativeYearMonthRefineOps } from './calendarNative'
import { IsoDateFields } from './calendarIsoFields'

export const gregoryPartOps: NativePartOps = {
  ...isoPartOps,
  eraParts: computeGregoryEraParts,
}

export const gregoryYearMonthRefineOps: NativeYearMonthRefineOps = {
  ...isoYearMonthRefineOps,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryDateRefineOps: NativeDateRefineOps = {
  ...isoDateRefineOps,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryMonthDayRefineOps: NativeMonthDayRefineOps = {
  ...isoMonthDayRefineOps,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryYearMonthModOps: NativeYearMonthModOps = {
  ...isoYearMonthModOps,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryDateModOps: NativeDateModOps = {
  ...isoDateModOps,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryMonthDayModOps: NativeMonthDayModOps = {
  ...isoMonthDayModOps,
  getEraOrigins: getGregoryEraOrigins,
}

export const gregoryStandardOps: NativeStandardOps = {
  ...isoStandardOps,
  eraParts: computeGregoryEraParts,
  getEraOrigins: getGregoryEraOrigins,
}

// -------------------------------------------------------------------------------------------------

export function computeGregoryEraParts({ isoYear }: IsoDateFields): EraParts {
  if (isoYear < 0) {
    return ['bce', -isoYear + 1]
  }
  return ['ce', isoYear]
}

function getGregoryEraOrigins(): Record<string, number> {
  return gregoryCalendarOrigins
}
