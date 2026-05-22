import { NativeTemporal } from '../../nativeSwitch'
import { createInstantNativeRecord } from './instant'
import { createPlainDateNativeRecord } from './plainDate'
import { createPlainDateTimeNativeRecord } from './plainDateTime'
import { createPlainTimeNativeRecord } from './plainTime'
import { createZonedDateTimeNativeRecord } from './zonedDateTime'

export function timeZoneId() {
  return NativeTemporal!.Now.timeZoneId()
}

export function instant() {
  return createInstantNativeRecord(NativeTemporal!.Now.instant())
}

export function zonedDateTimeISO(timeZoneId?: string) {
  return createZonedDateTimeNativeRecord(
    NativeTemporal!.Now.zonedDateTimeISO(timeZoneId),
  )
}

export function plainDateTimeISO(timeZoneId?: string) {
  return createPlainDateTimeNativeRecord(
    NativeTemporal!.Now.plainDateTimeISO(timeZoneId),
  )
}

export function plainDateISO(timeZoneId?: string) {
  return createPlainDateNativeRecord(
    NativeTemporal!.Now.plainDateISO(timeZoneId),
  )
}

export function plainTimeISO(timeZoneId?: string) {
  return createPlainTimeNativeRecord(
    NativeTemporal!.Now.plainTimeISO(timeZoneId),
  )
}
