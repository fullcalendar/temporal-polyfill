import { Temporal } from 'temporal-spec'
import { parseDiffOptions } from '../argParse/diffOptions'
import { DurationToStringUnitInt, parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { ensureOptionsObj, isObjectLike } from '../argParse/refine'
import { parseTotalConfig } from '../argParse/totalOptions'
import { AbstractNoValueObj, ensureObj } from '../dateUtils/abstract'
import { compareDurations } from '../dateUtils/compare'
import {
  DurationFields,
  UnsignedDurationFields,
  absDuration,
  computeLargestDurationUnit,
  negateDuration,
  refineDurationNumbers,
} from '../dateUtils/durationFields'
import { processDurationFields } from '../dateUtils/fromAndWith'
import { formatDurationISO } from '../dateUtils/isoFormat'
import { attachStringTag } from '../dateUtils/mixins'
import { parseDuration } from '../dateUtils/parseDuration'
import { extractRelativeTo } from '../dateUtils/relativeTo'
import { roundDuration } from '../dateUtils/roundingDuration'
import { computeTotalUnits } from '../dateUtils/totalUnits'
import { addDurationFields } from '../dateUtils/translate'
import { NANOSECOND, SECOND, UnitInt, YEAR } from '../dateUtils/units'
import { LocalesArg } from '../native/intlUtils'
import { createWeakMap } from '../utils/obj'
import { PlainDateTimeArg } from './plainDateTime'
import { ZonedDateTimeArg } from './zonedDateTime'

export type DurationArg = Temporal.Duration | Temporal.DurationLike | string

// guaranteed options object
type DurationRoundingOptions = Temporal.DifferenceOptions<Temporal.DateTimeUnit> & {
  relativeTo?: ZonedDateTimeArg | PlainDateTimeArg
}

const [getFields, setFields] = createWeakMap<Duration, DurationFields>()

export class Duration extends AbstractNoValueObj implements Temporal.Duration {
  constructor(
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
    microseconds = 0,
    nanoseconds = 0,
  ) {
    super()
    const numberFields = processDurationFields({ // TODO: overkill. does hasAnyProps
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
    })
    setFields(this, refineDurationNumbers(numberFields))
  }

  static from(arg: DurationArg): Temporal.Duration {
    return createDuration(
      typeof arg === 'object'
        ? processDurationFields(arg)
        : parseDuration(arg),
    )
  }

  static compare(
    a: DurationArg,
    b: DurationArg,
    options?: Temporal.DurationArithmeticOptions,
  ): Temporal.ComparisonResult {
    return compareDurations(
      ensureObj(Duration, a),
      ensureObj(Duration, b),
      extractRelativeTo(ensureOptionsObj(options).relativeTo),
    )
  }

  get years(): number { return getFields(this).years }
  get months(): number { return getFields(this).months }
  get weeks(): number { return getFields(this).weeks }
  get days(): number { return getFields(this).days }
  get hours(): number { return getFields(this).hours }
  get minutes(): number { return getFields(this).minutes }
  get seconds(): number { return getFields(this).seconds }
  get milliseconds(): number { return getFields(this).milliseconds }
  get microseconds(): number { return getFields(this).microseconds }
  get nanoseconds(): number { return getFields(this).nanoseconds }
  get sign(): Temporal.ComparisonResult { return getFields(this).sign }
  get blank(): boolean { return !this.sign }

  with(fields: Temporal.DurationLike): Temporal.Duration {
    return createDuration({
      ...getFields(this),
      ...processDurationFields(fields),
    })
  }

  negated(): Temporal.Duration {
    return createDuration(negateDuration(getFields(this)))
  }

  abs(): Temporal.Duration {
    return createDuration(absDuration(getFields(this)))
  }

  add(other: DurationArg, options?: Temporal.DurationArithmeticOptions): Temporal.Duration {
    return addDurations(this, ensureObj(Duration, other), options)
  }

  subtract(other: DurationArg, options?: Temporal.DurationArithmeticOptions): Temporal.Duration {
    return addDurations(this, negateDuration(ensureObj(Duration, other)), options)
  }

  round(options: Temporal.DurationRoundTo): Temporal.Duration {
    const optionsObj: DurationRoundingOptions = typeof options === 'string'
      ? { smallestUnit: options }
      : options

    if (!isObjectLike(optionsObj)) {
      throw new TypeError('Must specify options') // best place for this?
    } else if (optionsObj.largestUnit === undefined && optionsObj.smallestUnit === undefined) {
      throw new RangeError('Must specify either largestUnit or smallestUnit')
    }

    const defaultLargestUnit = computeLargestDurationUnit(this)
    const diffConfig = parseDiffOptions<Temporal.DateTimeUnit, UnitInt>(
      optionsObj,
      defaultLargestUnit, // largestUnitDefault
      NANOSECOND, // smallestUnitDefault
      NANOSECOND, // minUnit
      YEAR, // maxUnit
      true, // forDurationRounding
    )

    const relativeTo = extractRelativeTo((optionsObj as DurationRoundingOptions).relativeTo)
    // weird

    return createDuration(
      roundDuration(this, diffConfig, relativeTo, relativeTo ? relativeTo.calendar : undefined),
    )
  }

  total(options: Temporal.DurationTotalOf): number {
    const totalConfig = parseTotalConfig(options)
    const relativeTo = extractRelativeTo(totalConfig.relativeTo)

    return computeTotalUnits(
      this,
      totalConfig.unit,
      relativeTo,
      relativeTo ? relativeTo.calendar : undefined,
    )
  }

  toString(options?: Temporal.ToStringPrecisionOptions): string {
    const formatConfig = parseTimeToStringOptions<DurationToStringUnitInt>(
      options, SECOND,
    )
    return formatDurationISO(getFields(this), formatConfig)
  }

  toLocaleString(_locales?: LocalesArg, _options?: unknown): string {
    // the spec recommends this in the absence of Intl.DurationFormat
    return this.toString()
  }
}

// mixins
export interface Duration { [Symbol.toStringTag]: 'Temporal.Duration' }
attachStringTag(Duration, 'Duration')

export function createDuration(fields: UnsignedDurationFields): Duration {
  return new Duration(
    fields.years,
    fields.months,
    fields.weeks,
    fields.days,
    fields.hours,
    fields.minutes,
    fields.seconds,
    fields.milliseconds,
    fields.microseconds,
    fields.nanoseconds,
  )
}

function addDurations(
  d0: DurationFields,
  d1: DurationFields,
  options?: Temporal.DurationArithmeticOptions,
): Duration {
  const relativeTo = extractRelativeTo(ensureOptionsObj(options).relativeTo)

  return createDuration(
    addDurationFields(d0, d1, relativeTo, relativeTo ? relativeTo.calendar : undefined),
  )
}
