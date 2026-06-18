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
import { queryTimeZone } from '../../internal/timeZone'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { ShimInstantRecord, createShimInstantRecord } from './instant'
import { ShimPlainDateRecord, createShimPlainDateRecord } from './plainDate'
import {
  ShimPlainDateTimeRecord,
  createShimPlainDateTimeRecord,
} from './plainDateTime'
import { ShimPlainTimeRecord, createShimPlainTimeRecord } from './plainTime'
import {
  ShimZonedDateTimeRecord,
  createShimZonedDateTimeRecord,
} from './zonedDateTime'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): ShimInstantRecord {
  return createShimInstantRecord(createEpochNanoSlots(getCurrentEpochNano()))
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ShimZonedDateTimeRecord {
  const timeZone = queryTimeZone(refineTimeZoneId(timeZoneId))
  return createShimZonedDateTimeRecord(
    // Omitting calendar constructs ISO-calendar slots.
    createZonedEpochNanoSlots(getCurrentEpochNano(), timeZone),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ShimPlainDateTimeRecord {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createShimPlainDateTimeRecord(
    // Omitting calendar constructs ISO-calendar slots.
    createDateTimeSlots(isoDateTime),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ShimPlainDateRecord {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createShimPlainDateRecord(
    // Omitting calendar constructs ISO-calendar slots.
    createDateSlots(isoDateTime),
  )
}

export function plainTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ShimPlainTimeRecord {
  const isoDateTime = getCurrentIsoDateTime(
    queryTimeZone(refineTimeZoneId(timeZoneId)),
  )
  return createShimPlainTimeRecord(createTimeSlots(isoDateTime))
}
