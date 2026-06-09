import { NativeTemporal } from '../../nativeSwitch'
import { NativeInstantRecord, createNativeInstantRecord } from './instant'
import { NativePlainDateRecord, createNativePlainDateRecord } from './plainDate'
import {
  NativePlainDateTimeRecord,
  createNativePlainDateTimeRecord,
} from './plainDateTime'
import { NativePlainTimeRecord, createNativePlainTimeRecord } from './plainTime'
import {
  NativeZonedDateTimeRecord,
  createNativeZonedDateTimeRecord,
} from './zonedDateTime'

export function timeZoneId(): string {
  return NativeTemporal!.Now.timeZoneId()
}

export function instant(): NativeInstantRecord {
  return createNativeInstantRecord(NativeTemporal!.Now.instant())
}

export function zonedDateTimeISO(
  timeZoneId?: string,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    NativeTemporal!.Now.zonedDateTimeISO(timeZoneId),
  )
}

export function plainDateTimeISO(
  timeZoneId?: string,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    NativeTemporal!.Now.plainDateTimeISO(timeZoneId),
  )
}

export function plainDateISO(timeZoneId?: string): NativePlainDateRecord {
  return createNativePlainDateRecord(
    NativeTemporal!.Now.plainDateISO(timeZoneId),
  )
}

export function plainTimeISO(timeZoneId?: string): NativePlainTimeRecord {
  return createNativePlainTimeRecord(
    NativeTemporal!.Now.plainTimeISO(timeZoneId),
  )
}
