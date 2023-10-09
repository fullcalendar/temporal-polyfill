import { Instant, createInstant, getInstantSlots } from './instant'
import { IsoDateTimeFields } from './isoFields'
import { ensureString } from './cast'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZone'
import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import { validateOffsetNano } from './timeZoneOps'
import { InstantBranding, IsoDateTimeSlots, PlainDateTimeBranding } from './slots'

export class TimeZoneOpsAdapter {
  constructor(public t: TimeZoneProtocol) {}

  getOffsetNanosecondsFor(epochNano: DayTimeNano): number {
    return validateOffsetNano(
      this.t.getOffsetNanosecondsFor(
        createInstant({
          branding: InstantBranding,
          epochNanoseconds: epochNano
        })
      )
    )
  }

  getPossibleInstantsFor(isoDateTimeSlots: IsoDateTimeSlots): DayTimeNano[] {
    return [...this.t.getPossibleInstantsFor(
      createPlainDateTime({
        ...isoDateTimeSlots,
        branding: PlainDateTimeBranding,
      })
    )].map((instant: Instant) => {
      return getInstantSlots(instant).epochNanoseconds
    })
  }

  get id(): string {
    return ensureString(this.t.id)
  }
}
