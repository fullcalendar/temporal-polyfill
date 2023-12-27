import { EpochDisambigOptions } from '../internal/optionsRefine'
import { CalendarArg } from './calendar'
import { Instant, InstantArg } from './instant'
import { PlainDateTime, PlainDateTimeArg } from './plainDateTime'
import { createProtocolChecker } from './utils'
import { TimeZoneArg } from './timeZone'
import { timeZoneAdapters } from './timeZoneAdapter'

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

const requiredMethodNames = Object.keys(timeZoneAdapters)
export const checkTimeZoneProtocol = createProtocolChecker(requiredMethodNames)
