import { gregoryCalendarOrigins } from './calendarConfig'
import { EraParts } from './calendarNative'
import { IsoDateFields } from './calendarIsoFields'

export function computeGregoryEraParts({ isoYear }: IsoDateFields): EraParts {
  if (isoYear < 0) {
    return ['bce', -isoYear + 1]
  }
  return ['ce', isoYear]
}

export function getGregoryEraOrigins(): Record<string, number> {
  return gregoryCalendarOrigins
}
