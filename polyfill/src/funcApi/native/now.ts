import { NativeTemporal } from '../../nativeSwitch'
import { NativeInstantRecord, createNativeInstantRecord } from './instant'
import { NativePlainDateRecord, createNativePlainDateRecord } from './plainDate'
import {
  NativePlainDateTimeRecord,
  createNativePlainDateTimeRecord,
} from './plainDateTime'
import { NativePlainTimeRecord, createNativePlainTimeRecord } from './plainTime'
import { requireTimeZoneId } from './timeZoneId'
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
    NativeTemporal!.Now.zonedDateTimeISO(requireTimeZoneId(timeZoneId)),
  )
}

export function plainDateTimeISO(
  timeZoneId?: string,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    NativeTemporal!.Now.plainDateTimeISO(requireTimeZoneId(timeZoneId)),
  )
}

export function plainDateISO(timeZoneId?: string): NativePlainDateRecord {
  return createNativePlainDateRecord(
    NativeTemporal!.Now.plainDateISO(requireTimeZoneId(timeZoneId)),
  )
}

export function plainTimeISO(timeZoneId?: string): NativePlainTimeRecord {
  return createNativePlainTimeRecord(
    NativeTemporal!.Now.plainTimeISO(requireTimeZoneId(timeZoneId)),
  )
}
