import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields } from '../internal/isoFields'
import { validateOffsetNano } from '../internal/timeZoneOps'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { InstantBranding, PlainDateTimeBranding } from '../genericApi/branding'

// public
import { TimeZoneSlot } from './timeZoneSlot'
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZone'

export function createTimeZoneSlotRecord<ProtocolMethods extends Record<string, (this: TimeZoneProtocol, ...args: any[]) => any>>(
  slot: TimeZoneSlot,
  protocolMethods: ProtocolMethods,
): {
  [K in keyof ProtocolMethods]:
    ProtocolMethods[K] extends (this: TimeZoneProtocol, ...args: infer Args) => infer Ret
      ? (this: {}, ...args: Args) => Ret
      : never
} {
  if (typeof slot === 'string') {
    return queryNativeTimeZone(slot) as any // !!!
  }

  return createTimeZoneProtocolRecord(slot, protocolMethods) as any
}

export function createTimeZoneProtocolRecord<ProtocolMethods extends Record<string, (this: TimeZoneProtocol, ...args: any[]) => any>>(
  protocol: TimeZoneProtocol,
  protocolMethods: ProtocolMethods,
): {
  [K in keyof ProtocolMethods]:
    ProtocolMethods[K] extends (this: TimeZoneProtocol, ...args: infer Args) => infer Ret
      ? (...args: Args) => Ret
      : never
} {
  const recordMethods: any = {}

  for (const methodName in protocolMethods) {
    recordMethods[methodName] = protocolMethods[methodName].bind(protocol)
  }

  return recordMethods
}

// Preconfigured Creators
// -------------------------------------------------------------------------------------------------

export function createTypicalTimeZoneRecord(timeZoneSlot: TimeZoneSlot) {
  return createTimeZoneSlotRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
  })
}

export function createSimpleTimeZoneRecord(timeZoneSlot: TimeZoneSlot) {
  return createTimeZoneSlotRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
  })
}

// Individual Methods
// -------------------------------------------------------------------------------------------------

export function timeZoneProtocolGetOffsetNanosecondsFor(
  this: TimeZoneProtocol,
  epochNano: DayTimeNano,
): number {
  return validateOffsetNano(
    this.getOffsetNanosecondsFor(
      createInstant({
        branding: InstantBranding,
        epochNanoseconds: epochNano
      })
    )
  )
}

export function timeZoneProtocolGetPossibleInstantsFor(
  this: TimeZoneProtocol,
  isoFields: IsoDateTimeFields,
): DayTimeNano[] {
  return [...this.getPossibleInstantsFor(
    createPlainDateTime({
      ...isoFields,
      branding: PlainDateTimeBranding,
      calendar: isoCalendarId, // BAD, will need original slot
    })
  )].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}
