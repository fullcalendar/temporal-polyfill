import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../../internal/current'
import {
  createDateSlots,
  createDateTimeSlots,
  createEpochNanoSlots,
  createTimeSlots,
  createZonedEpochNanoSlots,
} from '../../internal/slots'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import { InstantShimRecord, createInstantShimRecord } from './instant'
import { PlainDateShimRecord, createPlainDateShimRecord } from './plainDate'
import {
  PlainDateTimeShimRecord,
  createPlainDateTimeShimRecord,
} from './plainDateTime'
import { PlainTimeShimRecord, createPlainTimeShimRecord } from './plainTime'
import {
  ZonedDateTimeShimRecord,
  createZonedDateTimeShimRecord,
} from './zonedDateTime'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantShimRecord {
  return createInstantShimRecord(createEpochNanoSlots(getCurrentEpochNano()))
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeShimRecord {
  const timeZone = queryTimeZone(refineTimeZoneId(timeZoneId))
  return createZonedDateTimeShimRecord(
    // Omitting calendar constructs ISO-calendar slots.
    createZonedEpochNanoSlots(getCurrentEpochNano(), timeZone),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeShimRecord {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainDateTimeShimRecord(
    // Omitting calendar constructs ISO-calendar slots.
    createDateTimeSlots(isoDateTime),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateShimRecord {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainDateShimRecord(
    // Omitting calendar constructs ISO-calendar slots.
    createDateSlots(isoDateTime),
  )
}

export function plainTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainTimeShimRecord {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createPlainTimeShimRecord(createTimeSlots(isoDateTime))
}
