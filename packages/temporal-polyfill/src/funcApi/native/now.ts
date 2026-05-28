import { NativeTemporal } from '../../nativeSwitch'
import { InstantNativeRecord, createInstantNativeRecord } from './instant'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'
import {
  PlainDateTimeNativeRecord,
  createPlainDateTimeNativeRecord,
} from './plainDateTime'
import { PlainTimeNativeRecord, createPlainTimeNativeRecord } from './plainTime'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

export function timeZoneId(): string {
  return NativeTemporal!.Now.timeZoneId()
}

export function instant(): InstantNativeRecord {
  return createInstantNativeRecord(NativeTemporal!.Now.instant())
}

export function zonedDateTimeISO(
  timeZoneId?: string,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    NativeTemporal!.Now.zonedDateTimeISO(timeZoneId),
  )
}

export function plainDateTimeISO(
  timeZoneId?: string,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    NativeTemporal!.Now.plainDateTimeISO(timeZoneId),
  )
}

export function plainDateISO(timeZoneId?: string): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    NativeTemporal!.Now.plainDateISO(timeZoneId),
  )
}

export function plainTimeISO(timeZoneId?: string): PlainTimeNativeRecord {
  return createPlainTimeNativeRecord(
    NativeTemporal!.Now.plainTimeISO(timeZoneId),
  )
}
