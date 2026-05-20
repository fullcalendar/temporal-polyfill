import { Temporal } from '../nativeSwitch'
import { createInstantNativeRecord } from './instant'
import { createPlainDateNativeRecord } from './plainDate'
import { createPlainDateTimeNativeRecord } from './plainDateTime'
import { createPlainTimeNativeRecord } from './plainTime'
import { createZonedDateTimeNativeRecord } from './zonedDateTime'

const NativeNow = Temporal!.Now

export const timeZoneId = NativeNow.timeZoneId as () => string

export function instant() {
  return createInstantNativeRecord(NativeNow.instant())
}

export function zonedDateTimeISO(timeZoneId?: string) {
  return createZonedDateTimeNativeRecord(NativeNow.zonedDateTimeISO(timeZoneId))
}

export function plainDateTimeISO(timeZoneId?: string) {
  return createPlainDateTimeNativeRecord(NativeNow.plainDateTimeISO(timeZoneId))
}

export function plainDateISO(timeZoneId?: string) {
  return createPlainDateNativeRecord(NativeNow.plainDateISO(timeZoneId))
}

export function plainTimeISO(timeZoneId?: string) {
  return createPlainTimeNativeRecord(NativeNow.plainTimeISO(timeZoneId))
}
