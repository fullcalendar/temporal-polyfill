import { createOptionParser } from './refine'

export const TIME_ZONE_DISPLAY_AUTO = 0
export const TIME_ZONE_DISPLAY_NEVER = 1
export type TimeZoneDisplayInt = 0 | 1

export interface TimeZoneDisplayMap {
  auto: 0
  never: 1
}
export const timeZoneDisplayMap: TimeZoneDisplayMap = {
  auto: 0,
  never: 1,
}

export const parseTimeZoneDisplayOption = createOptionParser(
  'timeZoneName',
  timeZoneDisplayMap,
  TIME_ZONE_DISPLAY_AUTO,
)
