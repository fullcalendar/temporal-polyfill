import { Temporal } from 'temporal-spec'
import { parseDisambigOption } from '../argParse/disambig'
import { toString } from '../argParse/fieldStr'
import { isObjectLike } from '../argParse/refine'
import { JsonMethods, ensureObj, mixinJsonMethods, needReceiver } from '../dateUtils/abstract'
import { epochNanoSymbol, epochNanoToISOFields, isoFieldsToEpochNano } from '../dateUtils/epoch'
import { formatOffsetISO } from '../dateUtils/isoFormat'
import { attachStringTag } from '../dateUtils/mixins'
import { checkInvalidOffset } from '../dateUtils/offset'
import { tryParseZonedDateTime } from '../dateUtils/parse'
import { refineZonedObj } from '../dateUtils/parseRefine'
import { getInstantFor, getSafeOffsetNanosecondsFor } from '../dateUtils/timeZone'
import { TimeZoneImpl } from '../timeZoneImpl/timeZoneImpl'
import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { createWeakMap } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
import { Instant, InstantArg } from './instant'
import { PlainDateTime, PlainDateTimeArg, createDateTime } from './plainDateTime'

// FYI: the Temporal.TimeZoneLike type includes `string`
// unlike many other object types

const [getImpl, setImpl] = createWeakMap<TimeZone, TimeZoneImpl>()

export class TimeZone implements Temporal.TimeZone {
  constructor(id: string) {
    if (!id) {
      throw new RangeError('Invalid timezone ID')
    }
    setImpl(this, queryTimeZoneImpl(id))
  }

  static from(arg: Temporal.TimeZoneLike): Temporal.TimeZoneProtocol {
    if (isObjectLike(arg)) {
      if (arg instanceof TimeZone) {
        return arg as any
      }
      if (!('timeZone' in arg)) {
        return arg
      } else {
        arg = arg.timeZone

        if (isObjectLike(arg) && !('timeZone' in arg)) {
          return arg as any
        }
      }
    }

    // parse as a string...
    const strVal = toString(arg)
    const parsed = tryParseZonedDateTime(strVal)

    if (parsed) {
      if (parsed.timeZone) {
        const refined = refineZonedObj(parsed) // TODO: we don't need the calendar
        checkInvalidOffset(refined)
        return refined.timeZone
      } else if (parsed.Z) {
        return new TimeZone('UTC')
      } else if (parsed.offsetNanoseconds !== undefined) {
        return new TimeZone(formatOffsetISO(parsed.offsetNanoseconds))
      }
    }

    return new TimeZone(strVal) // consider arg the literal time zone ID string
  }

  get id(): string {
    needReceiver(TimeZone, this)
    return getImpl(this).id
  }

  getOffsetStringFor(instantArg: InstantArg): string {
    needReceiver(TimeZone, this)
    return formatOffsetISO(getSafeOffsetNanosecondsFor(this, instantArg))
  }

  getOffsetNanosecondsFor(instantArg: InstantArg): number {
    needReceiver(TimeZone, this)
    const instant = ensureObj(Instant, instantArg)
    return getImpl(this).getOffset(instant[epochNanoSymbol])
  }

  getPlainDateTimeFor(
    instantArg: InstantArg,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
  ): Temporal.PlainDateTime {
    needReceiver(TimeZone, this)
    const instant = ensureObj(Instant, instantArg)
    const isoFields = epochNanoToISOFields(
      instant[epochNanoSymbol].add(getSafeOffsetNanosecondsFor(this, instant)),
    )
    return createDateTime({
      ...isoFields,
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  getInstantFor(
    dateTimeArg: PlainDateTimeArg,
    options?: Temporal.ToInstantOptions,
  ): Temporal.Instant {
    needReceiver(TimeZone, this)
    return getInstantFor(this, ensureObj(PlainDateTime, dateTimeArg), parseDisambigOption(options))
  }

  getPossibleInstantsFor(dateTimeArg: PlainDateTimeArg): Temporal.Instant[] {
    needReceiver(TimeZone, this)

    const isoFields = ensureObj(PlainDateTime, dateTimeArg).getISOFields()
    const zoneNano = isoFieldsToEpochNano(isoFields)
    const possibleOffsetNanos = getImpl(this).getPossibleOffsets(zoneNano)

    return possibleOffsetNanos.map((offsetNano) => (
      new Instant(zoneNano.sub(offsetNano))
    ))
  }

  getPreviousTransition(instantArg: InstantArg): Temporal.Instant | null {
    needReceiver(TimeZone, this)
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant[epochNanoSymbol], -1)
    if (rawTransition) {
      return new Instant(rawTransition[0])
    }
    return null
  }

  getNextTransition(instantArg: InstantArg): Temporal.Instant | null {
    needReceiver(TimeZone, this)
    const instant = ensureObj(Instant, instantArg)
    const rawTransition = getImpl(this).getTransition(instant[epochNanoSymbol], 1)
    if (rawTransition) {
      return new Instant(rawTransition[0])
    }
    return null
  }

  toString(): string {
    needReceiver(TimeZone, this)
    return getImpl(this).id
  }
}

// mixins
export interface TimeZone extends JsonMethods {}
mixinJsonMethods(TimeZone)
//
export interface TimeZone { [Symbol.toStringTag]: 'Temporal.TimeZone' }
attachStringTag(TimeZone, 'TimeZone')
