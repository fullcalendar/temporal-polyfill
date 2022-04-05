import { parseDiffOptions } from '../argParse/diffOptions'
import { DurationToStringUnitInt, parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { ensureOptionsObj, isObjectLike } from '../argParse/refine'
import { parseTotalConfig } from '../argParse/totalOptions'
import { AbstractNoValueObj, ensureObj } from '../dateUtils/abstract'
import { compareDurations } from '../dateUtils/compare'
import {
  absDuration,
  computeLargestDurationUnit,
  negateDuration,
  refineDurationNumbers,
} from '../dateUtils/durationFields'
import { processDurationFields } from '../dateUtils/fromAndWith'
import { formatDurationISO } from '../dateUtils/isoFormat'
import { parseDuration } from '../dateUtils/parseDuration'
import { extractRelativeTo } from '../dateUtils/relativeTo'
import { roundDuration } from '../dateUtils/rounding'
import { computeTotalUnits } from '../dateUtils/totalUnits'
import { addDurationFields } from '../dateUtils/translate'
import { DurationFields, UnsignedDurationFields } from '../dateUtils/typesPrivate'
import { NANOSECOND, SECOND, UnitInt, YEAR } from '../dateUtils/units'
import {
  CompareResult,
  DateTimeArg,
  DurationArg,
  DurationLike,
  DurationRoundingOptions,
  DurationToStringOptions,
  DurationToStringUnit,
  DurationTotalOptions,
  LocalesArg,
  Unit,
  ZonedDateTimeArg,
} from '../public/types'
import { createWeakMap } from '../utils/obj'

const [getFields, setFields] = createWeakMap<Duration, DurationFields>()

export class Duration extends AbstractNoValueObj {
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

  static from(arg: DurationArg): Duration {
    return createDuration(
      typeof arg === 'object'
        ? processDurationFields(arg)
        : parseDuration(arg),
    )
  }

  static compare(
    a: DurationArg,
    b: DurationArg,
    options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg },
  ): CompareResult {
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
  get sign(): CompareResult { return getFields(this).sign }
  get blank(): boolean { return !this.sign }

  with(fields: DurationLike): Duration {
    return createDuration({
      ...getFields(this),
      ...processDurationFields(fields),
    })
  }

  negated(): Duration {
    return createDuration(negateDuration(getFields(this)))
  }

  abs(): Duration {
    return createDuration(absDuration(getFields(this)))
  }

  add(other: DurationArg, options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg}): Duration {
    return addDurations(this, ensureObj(Duration, other), options)
  }

  subtract(other: DurationArg, options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg}): Duration {
    return addDurations(this, negateDuration(ensureObj(Duration, other)), options)
  }

  round(options: DurationRoundingOptions | Unit): Duration {
    const optionsObj: DurationRoundingOptions = typeof options === 'string'
      ? { smallestUnit: options }
      : options

    if (!isObjectLike(optionsObj)) {
      throw new TypeError('Must specify options') // best place for this?
    } else if (optionsObj.largestUnit === undefined && optionsObj.smallestUnit === undefined) {
      throw new RangeError('Must specify either largestUnit or smallestUnit')
    }

    const defaultLargestUnit = computeLargestDurationUnit(this)
    const diffConfig = parseDiffOptions<Unit, UnitInt>(
      optionsObj,
      defaultLargestUnit, // largestUnitDefault
      NANOSECOND, // smallestUnitDefault
      NANOSECOND, // minUnit
      YEAR, // maxUnit
      false, // forInstant
      true, // forRounding
    )

    const relativeTo = extractRelativeTo(optionsObj.relativeTo)

    return createDuration(
      roundDuration(this, diffConfig, relativeTo, relativeTo ? relativeTo.calendar : undefined),
    )
  }

  total(options: DurationTotalOptions | Unit): number {
    const totalConfig = parseTotalConfig(options)
    const relativeTo = extractRelativeTo(totalConfig.relativeTo)

    return computeTotalUnits(
      this,
      totalConfig.unit,
      relativeTo,
      relativeTo ? relativeTo.calendar : undefined,
    )
  }

  toString(options?: DurationToStringOptions): string {
    const formatConfig = parseTimeToStringOptions<DurationToStringUnit, DurationToStringUnitInt>(
      options, SECOND,
    )
    return formatDurationISO(getFields(this), formatConfig)
  }

  toLocaleString(_locales?: LocalesArg, _options?: unknown): string {
    // the spec recommends this in the absence of Intl.DurationFormat
    return this.toString()
  }
}

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
  options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg },
): Duration {
  const relativeTo = extractRelativeTo(ensureOptionsObj(options).relativeTo)

  return createDuration(
    addDurationFields(d0, d1, relativeTo, relativeTo ? relativeTo.calendar : undefined),
  )
}
