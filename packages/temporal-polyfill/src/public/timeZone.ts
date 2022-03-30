import {
  DISAMBIG_COMPATIBLE,
  DISAMBIG_EARLIER,
  DISAMBIG_REJECT,
  parseDisambigOption,
} from '../argParse/disambig'
import { isTimeZoneArgBag, parseTimeZoneFromBag } from '../argParse/timeZone'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import { formatOffsetISO } from '../dateUtils/isoFormat'
import { epochNanoToISOFields, isoFieldsToEpochNano } from '../dateUtils/isoMath'
import { checkInvalidOffset } from '../dateUtils/offset'
import { tryParseZonedDateTime } from '../dateUtils/parse'
import { refineZonedObj } from '../dateUtils/parseRefine'
import { TimeZoneImpl } from '../timeZoneImpl/timeZoneImpl'
import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { createWeakMap } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
import { Instant } from './instant'
import { PlainDateTime, createDateTime } from './plainDateTime'
import {
  CalendarArg,
  DateTimeArg,
  Disambiguation,
  InstantArg,
  TimeZoneArg,
  TimeZoneProtocol,
} from './types'

const [getImpl, setImpl] = createWeakMap<TimeZone, TimeZoneImpl>()

export class TimeZone extends AbstractObj implements TimeZoneProtocol {
  constructor(id: string) {
    if (!id) {
      throw new RangeError('Invalid timezone ID')
    }
    super()
    setImpl(this, queryTimeZoneImpl(id))
  }

  static from(arg: TimeZoneArg): TimeZone {
    if (typeof arg === 'object') {
      if (isTimeZoneArgBag(arg)) {
        return parseTimeZoneFromBag(arg.timeZone)
      } else {
        return arg as TimeZone // treat TimeZoneProtocols as TimeZones internally
      }
    }

    const parsed = tryParseZonedDateTime(String(arg))

    if (parsed) {
      if (parsed.timeZone) {
        const refined = refineZonedObj(parsed) // TODO: we don't need the calendar
        checkInvalidOffset(refined)
        return refined.timeZone
      } else if (parsed.Z) {
        return new TimeZone('UTC')
      } else if (parsed.offset !== undefined) {
        return new TimeZone(formatOffsetISO(parsed.offset))
      }
    }

    return new TimeZone(arg) // consider arg the literal time zone ID string
  }

  get id(): string {
    return this.toString()
  }

  getOffsetStringFor(instantArg: InstantArg): string {
    return formatOffsetISO(this.getOffsetNanosecondsFor(instantArg))
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    const instant = ensureObj(Instant, instantArg)
    return getImpl(this).getOffset(instant.epochNanoseconds)
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: CalendarArg = createDefaultCalendar(),
  ): PlainDateTime {
    const instant = ensureObj(Instant, instantArg)
    const isoFields = epochNanoToISOFields(
      instant.epochNanoseconds + BigInt(this.getOffsetNanosecondsFor(instant)),
    )
    return createDateTime({
      ...isoFields,
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  getInstantFor(dateTimeArg: DateTimeArg, options?: { disambiguation?: Disambiguation }): Instant {
    const disambig = parseDisambigOption(options)
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneNano = isoFieldsToEpochNano(isoFields)
    const possibleOffsetNanos = getImpl(this).getPossibleOffsets(zoneNano)
    let offsetNano: number

    if (possibleOffsetNanos.length === 1 || disambig === DISAMBIG_COMPATIBLE) {
      offsetNano = possibleOffsetNanos[0]
    } else if (disambig === DISAMBIG_REJECT) {
      throw new RangeError('Ambiguous offset')
    } else {
      offsetNano = Math[
        disambig === DISAMBIG_EARLIER
          ? 'max' // (results in an earlier epochNano, because offsetNano is subtracted)
          : 'min' // DISAMBIG_LATER
      ](...(possibleOffsetNanos as [number, number]))
    }

    return new Instant(zoneNano - BigInt(offsetNano))
  }

  getPossibleInstantsFor(dateTimeArg: DateTimeArg): Instant[] {
    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneNano = isoFieldsToEpochNano(isoFields)
    let possibleOffsetNanos = getImpl(this).getPossibleOffsets(zoneNano)

    // A forward transition looses an hour.
    // dateTimeArg is stuck in this lost hour, so return not results
    if (
      possibleOffsetNanos.length === 2 &&
      possibleOffsetNanos[0] < possibleOffsetNanos[1]
    ) {
      possibleOffsetNanos = []
    }

    return possibleOffsetNanos.map((offsetNano) => (
      new Instant(zoneNano - BigInt(offsetNano))
    ))
  }

  getPreviousTransition(instantArg: InstantArg): Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant.epochNanoseconds, -1)
    if (rawTransition) {
      return new Instant(rawTransition[0])
    }
    return null
  }

  getNextTransition(instantArg: InstantArg): Instant | null {
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant.epochNanoseconds, 1)
    if (rawTransition) {
      return new Instant(rawTransition[0])
    }
    return null
  }

  toString(): string {
    return getImpl(this).id
  }
}
