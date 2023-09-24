import { WrapperInstance, createWrapperClass, getStrictInternals } from './class'
import { Instant, createInstant } from './instant'
import { IsoDateTimeFields } from './isoFields'
import { ensureString } from './cast'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZone'
import { BoundArg } from './utils'
import { queryCalendarImpl } from './calendarImpl'
import { isoCalendarId } from './calendarConfig'
import { DayTimeNano } from './dayTimeNano'
import { validateOffsetNano } from './timeZoneOps'

const getInstantEpochNano = getStrictInternals.bind<
  undefined, [BoundArg],
  [Instant],
  DayTimeNano // return
>(undefined, Instant)

const timeZoneOpsAdapterMethods = {
  getOffsetNanosecondsFor(timeZone: TimeZoneProtocol, epochNano: DayTimeNano): number {
    return validateOffsetNano(timeZone.getOffsetNanosecondsFor(createInstant(epochNano)))
  },

  getPossibleInstantsFor(
    timeZone: TimeZoneProtocol,
    isoDateTimeFields: IsoDateTimeFields
  ): DayTimeNano[] {
    return [...timeZone.getPossibleInstantsFor(
      createPlainDateTime({
        ...isoDateTimeFields,
        calendar: queryCalendarImpl(isoCalendarId),
      })
    )].map(getInstantEpochNano)
  },
}

const timeZoneOpsAdapterGetters = {
  id(timeZone: TimeZoneProtocol): string {
    return ensureString(timeZone.id)
  }
}

export type TimeZoneOpsAdapter = WrapperInstance<
  TimeZoneProtocol, // internals
  typeof timeZoneOpsAdapterGetters, // getters
  typeof timeZoneOpsAdapterMethods // methods
>

export const TimeZoneOpsAdapter = createWrapperClass<
  [TimeZoneProtocol],
  TimeZoneProtocol,
  typeof timeZoneOpsAdapterGetters,
  typeof timeZoneOpsAdapterMethods // methods
>(timeZoneOpsAdapterGetters, timeZoneOpsAdapterMethods)

