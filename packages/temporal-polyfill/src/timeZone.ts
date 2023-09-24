import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'
import { CalendarArg } from './calendar'
import { queryCalendarOps } from './calendarOpsQuery'
import { TemporalInstance, createSimpleTemporalClass, getObjId, idGetters } from './class'
import { Instant, InstantArg, createInstant, toInstantEpochNano } from './instant'
import { formatOffsetNano } from './isoFormat'
import { EpochDisambigOptions, refineEpochDisambigOptions } from './options'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { getSingleInstantFor, queryTimeZoneOps, queryTimeZonePublic, zonedEpochNanoToIsoWithTZObj } from './timeZoneOps'
import { isTimeZonesEqual, validateOffsetNano } from './timeZoneOps'
import { TimeZoneOpsAdapter } from './timeZoneOpsAdapter'
import { isoCalendarId } from './calendarConfig'
import { ZonedDateTime } from './zonedDateTime'

interface TimeZoneProtocolMethods {
  getOffsetNanosecondsFor(instant: InstantArg): number
  getOffsetStringFor?(instant: InstantArg): string
  getPlainDateTimeFor?(instant: InstantArg, calendarArg?: CalendarArg): PlainDateTime
  getInstantFor?(dateTime: PlainDateTimeArg, options?: EpochDisambigOptions): Instant
  getNextTransition?(startingPoint: InstantArg): Instant | null
  getPreviousTransition?(startingPoint: InstantArg): Instant | null
  getPossibleInstantsFor(dateTime: PlainDateTimeArg): Instant[]
  toString?(): string
  toJSON?(): string
  equals?(otherArg: TimeZoneArg): boolean
}

export interface TimeZoneProtocol extends TimeZoneProtocolMethods {
  id: string
}

// the *required* protocol methods
export const timeZoneProtocolMethods = {
  getPossibleInstantsFor(impl: TimeZoneImpl, plainDateTimeArg: PlainDateTimeArg): Instant[]  {
    return impl.getPossibleInstantsFor(toPlainDateTimeInternals(plainDateTimeArg))
      .map(createInstant)
  },

  getOffsetNanosecondsFor: getImplOffsetNanosecondsFor,
}

// TODO: move elsewhere
// TODO: use TS `satisfies` on main class?
type Unmethodize<F> = F extends ((...args: infer A) => infer R)
  ? (impl: TimeZoneImpl, ...args: A) => R
  : never

const timeZoneMethods: {
  [K in keyof TimeZoneProtocolMethods]: Unmethodize<TimeZoneProtocolMethods[K]>
} = {
  ...timeZoneProtocolMethods,

  getOffsetStringFor(this: TimeZone, impl: TimeZoneImpl, instantArg: InstantArg): string {
    return formatOffsetNano(
      // strange we leverage the TimeZone here, but necessary for TimeZone subclasses
      // COPIED from timeZoneOpsAdapterMethods::getOffsetNanosecondsFor
      validateOffsetNano(this.getOffsetNanosecondsFor(createInstant(toInstantEpochNano(instantArg))))
    )
  },

  getPlainDateTimeFor(
    this: TimeZone,
    impl: TimeZoneImpl,
    instantArg: InstantArg,
    calendarArg: CalendarArg = isoCalendarId
  ): PlainDateTime {
    const epochNano = toInstantEpochNano(instantArg)

    return createPlainDateTime({
      calendar: queryCalendarOps(calendarArg),
      ...zonedEpochNanoToIsoWithTZObj(this, epochNano),
    })
  },

  getInstantFor(
    this: TimeZone,
    impl: TimeZoneImpl,
    plainDateTimeArg: PlainDateTimeArg,
    options?: EpochDisambigOptions
  ): Instant {
    return createInstant(
      getSingleInstantFor(
        new TimeZoneOpsAdapter(this), // needed for internal call to getPossibleInstantsFor
        toPlainDateTimeInternals(plainDateTimeArg),
        refineEpochDisambigOptions(options),
      )
    )
  },

  getNextTransition: getImplTransition.bind(undefined, 1),

  getPreviousTransition: getImplTransition.bind(undefined, -1),

  toString: getObjId,

  equals(this: TimeZone, impl: TimeZoneImpl, otherArg: TimeZoneArg): boolean {
    return isTimeZonesEqual(this, queryTimeZoneOps(otherArg))
  }
}

export type TimeZoneArg = TimeZoneProtocol | string | ZonedDateTime

export type TimeZone = TemporalInstance<
  TimeZoneImpl, // internals
  typeof idGetters, // getters
  typeof timeZoneMethods // methods
>

export const [TimeZone, createTimeZone] = createSimpleTemporalClass(
  'TimeZone',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  queryTimeZoneImpl,

  // Getters
  // -----------------------------------------------------------------------------------------------

  idGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  timeZoneMethods,

  // Abstract
  // -----------------------------------------------------------------------------------------------

  {
    from: queryTimeZonePublic,
  }
)

function getImplOffsetNanosecondsFor(impl: TimeZoneImpl, instantArg: InstantArg): number {
  return impl.getOffsetNanosecondsFor(toInstantEpochNano(instantArg))
}

function getImplTransition(direction: -1 | 1, impl: TimeZoneImpl, instantArg: InstantArg): Instant | null {
  const epochNano = impl.getTransition(toInstantEpochNano(instantArg), direction)
  return epochNano ? createInstant(epochNano) : null
}
