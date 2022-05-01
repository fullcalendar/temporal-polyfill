import { Temporal } from 'temporal-spec'
import { isObjectLike } from '../argParse/refine'
import { PlainDateTime, PlainDateTimeArg, createDateTime } from '../public/plainDateTime'
import {
  ZonedDateTime,
  ZonedDateTimeArg,
  createZonedDateTimeFromFields,
} from '../public/zonedDateTime'
import { ensureObj } from './abstract'
import { tryParseZonedDateTime } from './parse'
import { refineBaseObj, refineZonedObj } from './parseRefine'

export function extractRelativeTo(
  arg: ZonedDateTimeArg | PlainDateTimeArg | undefined,
): ZonedDateTime | PlainDateTime | undefined {
  if (arg === undefined) {
    return undefined
  }

  if (isObjectLike(arg)) {
    if (arg instanceof ZonedDateTime || arg instanceof PlainDateTime) {
      return arg
    }
    return ensureObj<ZonedDateTime | PlainDateTime, Temporal.ZonedDateTimeLike, []>(
      (arg as Temporal.ZonedDateTimeLike).timeZone !== undefined
        ? ZonedDateTime
        : PlainDateTime,
      arg as Temporal.ZonedDateTimeLike,
    )
  }

  // assume a string...
  // TODO: general toString util for ALL parsing that prevents parsing symbols
  // https://github.com/ljharb/es-abstract/blob/main/2020/ToString.js
  if (typeof arg === 'symbol') {
    throw new TypeError('Incorrect relativeTo type')
  }

  const parsed = tryParseZonedDateTime(String(arg))
  if (parsed) {
    if (parsed.timeZone !== undefined) {
      return createZonedDateTimeFromFields(refineZonedObj(parsed), true)
    } else {
      return createDateTime(refineBaseObj(parsed))
    }
  }

  throw new RangeError('Invalid value of relativeTo')
}
