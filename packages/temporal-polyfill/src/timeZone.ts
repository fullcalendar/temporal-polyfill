import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'
import { CalendarArg } from './calendar'
import { queryCalendarOps } from './calendarOps'
import { TemporalInstance, createSimpleTemporalClass, getObjId, idGetters } from './class'
import { Instant, InstantArg, createInstant, toInstantEpochNano } from './instant'
import { formatOffsetNano } from './isoFormat'
import { refineEpochDisambigOptions } from './options'
import { PlainDateTime, PlainDateTimeArg, createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { getSingleInstantFor, queryTimeZonePublic, zonedEpochNanoToIso } from './timeZoneOps'
import { isoCalendarId } from './calendarConfig'
import { ZonedDateTime } from './zonedDateTime'

interface TimeZoneProtocolMethods {
  getOffsetNanosecondsFor(instant: InstantArg): number
  getOffsetStringFor?(instant: InstantArg): string
  getPlainDateTimeFor?(instant: InstantArg, calendarArg?: CalendarArg): PlainDateTime
  getInstantFor?(dateTime: PlainDateTimeArg, options?: any): Instant
  getNextTransition?(startingPoint: InstantArg): Instant | null
  getPreviousTransition?(startingPoint: InstantArg): Instant | null
  getPossibleInstantsFor(dateTime: PlainDateTimeArg): Instant[]
  toString?(): string;
  toJSON?(): string;
}

export interface TimeZoneProtocol extends TimeZoneProtocolMethods {
  id: string;
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

  getOffsetStringFor(impl: TimeZoneImpl, instantArg: InstantArg): string {
    return formatOffsetNano(getImplOffsetNanosecondsFor(impl, instantArg))
  },

  getPlainDateTimeFor(
    impl: TimeZoneImpl,
    instantArg: InstantArg,
    calendarArg: CalendarArg = isoCalendarId
  ): PlainDateTime {
    const epochNano = toInstantEpochNano(instantArg)

    return createPlainDateTime({
      calendar: queryCalendarOps(calendarArg),
      ...zonedEpochNanoToIso(impl, epochNano),
    })
  },

  getInstantFor(impl: TimeZoneImpl, plainDateTimeArg: PlainDateTimeArg, options: any): Instant {
    return createInstant(
      getSingleInstantFor(
        impl,
        toPlainDateTimeInternals(plainDateTimeArg),
        refineEpochDisambigOptions(options),
      )
    )
  },

  getNextTransition: getImplTransition.bind(undefined, 1),

  getPreviousTransition: getImplTransition.bind(undefined, -1),

  toString: getObjId,
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

  idGetters as { id: (impl: TimeZoneImpl) => string }, // type needed?

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
