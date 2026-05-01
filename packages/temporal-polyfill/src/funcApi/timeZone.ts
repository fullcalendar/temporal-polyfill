import { createInstantSlots } from '../internal/slots'
import { getTimeZoneAtomic, refineTimeZoneId } from '../internal/timeZoneId'
import { queryTimeZone } from '../internal/timeZoneImpl'
import { bindArgs } from '../internal/utils'
import * as InstantFns from './instant'
import * as PlainDateTimeFns from './plainDateTime'

export function getPossibleInstantsFor(
  timeZoneId: string,
  plainDateTime: PlainDateTimeFns.Record,
): InstantFns.Record[] {
  const timeZoneImpl = queryTimeZone(refineTimeZoneId(timeZoneId))
  return timeZoneImpl
    .getPossibleInstantsFor(plainDateTime.isoDate, plainDateTime.time)
    .map(createInstantSlots)
}

function getTransition(
  dir: 1 | -1,
  timeZoneId: string,
  instant: InstantFns.Record,
): InstantFns.Record | null {
  const timeZoneImpl = queryTimeZone(refineTimeZoneId(timeZoneId))
  const epochNano = timeZoneImpl.getTransition(instant.epochNanoseconds, dir)
  return epochNano ? createInstantSlots(epochNano) : null
}

export const getNextTransition = bindArgs(getTransition, 1)
export const getPreviousTransition = bindArgs(getTransition, -1)

export function equals(timeZoneId0: string, timeZoneId1: string): boolean {
  return getTimeZoneAtomic(timeZoneId0) === getTimeZoneAtomic(timeZoneId1)
}
