import {
  attachDebugString,
  invalidRecordType,
  recordValueOf,
} from '../../apiHelpers/classStyle'
import * as errorMessages from '../../internal/errorMessages'

const nativeRecords = new WeakSet<object>()

export { invalidRecordType, recordValueOf }

export function registerRecord<S>(
  instance: object,
  slots: S,
  formatSlots: (slots: S) => string,
) {
  nativeRecords.add(instance)
  attachDebugString(instance, slots, formatSlots)
}

export function rejectInvalidBag<B>(bag: B): B {
  if (
    (typeof bag === 'object' && bag !== null && nativeRecords.has(bag)) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store internal calendar/time-zone objects, but public bags still
    // use the spec property names.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}
