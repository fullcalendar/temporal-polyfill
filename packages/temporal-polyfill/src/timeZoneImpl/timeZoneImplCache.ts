import { FixedTimeZoneImpl } from './fixedTimeZoneImpl'
import { TimeZoneImpl } from './timeZoneImpl'

export const timeZoneImplCache: { [zoneName: string]: TimeZoneImpl } = {
  UTC: new FixedTimeZoneImpl(0),
}
