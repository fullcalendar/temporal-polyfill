import { durationFieldMap } from '../argParse/fieldStr'
import { DurationToStringUnitInt, parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { ensureOptionsObj, refineFields, refineOverrideFields } from '../argParse/refine'
import { parseUnit } from '../argParse/unitStr'
import { AbstractNoValueObj, ensureObj } from '../dateUtils/abstract'
import {
  SignedDurationFields,
  addAndBalanceDurations,
  compareDurations,
  createDuration,
  negateFields,
  refineDurationFields,
  roundAndBalanceDuration,
} from '../dateUtils/duration'
import { formatDurationISO } from '../dateUtils/isoFormat'
import { parseDurationISO } from '../dateUtils/parse'
import { computeTotalUnits } from '../dateUtils/totalUnits'
import { NANOSECOND, SECOND, UnitInt, YEAR } from '../dateUtils/units'
import { createWeakMap, mapHash } from '../utils/obj'
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
  ZonedDateTimeArg,
} from './types'

const [getFields, setFields] = createWeakMap<Duration, SignedDurationFields>()

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
    setFields(this, refineDurationFields({
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
    }))
  }

  static from(arg: DurationArg): Duration {
    return createDuration(
      typeof arg === 'object'
        ? refineFields(arg, durationFieldMap)
        : parseDurationISO(arg),
    )
  }

  static compare(
    a: DurationArg,
    b: DurationArg,
    options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg },
  ): CompareResult {
    return compareDurations(a, b, ensureOptionsObj(options).relativeTo)
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
      ...refineOverrideFields(fields, durationFieldMap),
    })
  }

  negated(): Duration {
    return createDuration(
      negateFields(getFields(this) as Partial<SignedDurationFields>), // TODO: fix types
    )
  }

  abs(): Duration {
    return createDuration(
      mapHash(
        getFields(this),
        (num: number) => Math.abs(num),
      ),
    )
  }

  add(other: DurationArg, options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg}): Duration {
    return addAndBalanceDurations(
      this,
      ensureObj(Duration, other),
      ensureOptionsObj(options).relativeTo,
    )
  }

  subtract(other: DurationArg, options?: { relativeTo?: ZonedDateTimeArg | DateTimeArg}): Duration {
    return addAndBalanceDurations(
      this,
      ensureObj(Duration, other).negated(),
      ensureOptionsObj(options).relativeTo,
    )
  }

  round(options: DurationRoundingOptions): Duration {
    return roundAndBalanceDuration(this, options)
  }

  total(options: DurationTotalOptions): number {
    return computeTotalUnits(
      this,
      parseUnit<UnitInt>(ensureOptionsObj(options).unit, undefined, NANOSECOND, YEAR),
      options.relativeTo,
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
