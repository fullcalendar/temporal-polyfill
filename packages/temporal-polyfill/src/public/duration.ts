import { mergeDurationBag, refineDurationBag } from '../internal/convert'
import {
  absDurationInternals,
  addDayTimeDurationFields,
  negateDurationInternals,
  refineDurationFields,
  DurationInternals,
  DurationFields,
  durationFieldNamesAsc,
  updateDurationFieldsSign,
} from '../internal/durationFields'
import { formatDurationInternals } from '../internal/isoFormat'
import { parseDuration } from '../internal/isoParse'
import {
  DurationRoundOptions,
  RelativeToOptions,
  SubsecDigits,
  TimeDisplayOptions,
  TotalUnitOptionsWithRel,
  refineDurationRoundOptions,
  refineRelativeToOptions,
  refineTimeDisplayOptions,
  refineTotalOptions,
} from '../internal/options'
import {
  MarkerSystem,
  SimpleMarkerSystem,
  balanceDayTimeDuration,
  roundDayTimeDuration,
  roundRelativeDuration,
  totalDayTimeDuration,
  totalRelativeDuration,
} from '../internal/round'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { DayTimeUnit, Unit, UnitName, givenFieldsToDayTimeNano } from '../internal/units'
import { MarkerToEpochNano, MoveMarker, DiffMarkers, createMarkerSystem } from '../internal/round'
import { DayTimeNano, compareDayTimeNanos } from '../internal/dayTimeNano'
import { DurationBranding, DurationSlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from '../internal/slots'
import { ensureString } from '../internal/cast'

// public
import { durationGettersMethods, neverValueOf } from './publicMixins'

export type DurationBag = Partial<DurationFields>
export type DurationMod = Partial<DurationFields>
export type DurationArg = Duration | DurationBag | string

export class Duration {
  constructor(
    years: number = 0,
    months: number = 0,
    weeks: number = 0,
    days: number = 0,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0,
    microseconds: number = 0,
    nanoseconds: number = 0,
  ) {
    setSlots(this, {
      branding: DurationBranding,
      ...refineDurationFields({
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
      }),
    })
  }

  with(mod: DurationMod): Duration {
    return createDuration({
      branding: DurationBranding,
      ...mergeDurationBag(getDurationSlots(this), mod)
    })
  }

  add(otherArg: DurationArg, options?: RelativeToOptions) {
    return addToDuration(1, getDurationSlots(this), otherArg, options)
  }

  subtract(otherArg: DurationArg, options?: RelativeToOptions) {
    return addToDuration(-1, getDurationSlots(this), otherArg, options)
  }

  negated(): Duration {
    return createDuration({
      branding: DurationBranding,
      ...negateDurationInternals(getDurationSlots(this))
    })
  }

  abs(): Duration {
    return createDuration({
      branding: DurationBranding,
      ...absDurationInternals(getDurationSlots(this))
    })
  }

  round(options: DurationRoundOptions): Duration {
    let slots = getDurationSlots(this)
    const durationLargestUnit = getLargestDurationUnit(slots)
    const [
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      markerInternals,
    ] = refineDurationRoundOptions(options, durationLargestUnit)

    const maxLargestUnit = Math.max(durationLargestUnit, largestUnit)

    // TODO: move to round.js?

    if (
      maxLargestUnit < Unit.Day || (
        maxLargestUnit === Unit.Day &&
        // has uniform days?
        !(markerInternals && (markerInternals as any).epochNanoseconds)
      )
    ) {
      // TODO: check internals doesn't have large fields
      return createDuration({
        branding: DurationBranding,
        ...updateDurationFieldsSign(
          roundDayTimeDuration(
            slots,
            largestUnit as DayTimeUnit, // guaranteed <= maxLargestUnit <= Unit.Day
            smallestUnit as DayTimeUnit,
            roundingInc,
            roundingMode,
          ),
        )
      })
    }

    if (!markerInternals) {
      throw new RangeError('need relativeTo')
    }

    const markerSystem = createMarkerSystem(markerInternals) as MarkerSystem<unknown>

    let transplantedWeeks = 0
    if (
      slots.weeks &&
      largestUnit >= Unit.Week &&
      smallestUnit <= Unit.Week
    ) {
      transplantedWeeks = slots.weeks
      slots = { ...slots, weeks: 0 }
    }

    const roundedDurationFields = roundRelativeDuration(
      ...spanDuration(slots, undefined, largestUnit, ...markerSystem),
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      ...(markerSystem as unknown as SimpleMarkerSystem<unknown>),
    )

    roundedDurationFields.weeks += transplantedWeeks // HACK (mutating)

    return createDuration({
      branding: DurationBranding,
      ...updateDurationFieldsSign(roundedDurationFields),
    })
  }

  total(options: TotalUnitOptionsWithRel | UnitName): number {
    const slots = getDurationSlots(this)
    const durationLargestUnit = getLargestDurationUnit(slots)
    const [totalUnit, markerInternals] = refineTotalOptions(options)
    const maxLargestUnit = Math.max(totalUnit, durationLargestUnit)

    if (
      maxLargestUnit < Unit.Day || (
        maxLargestUnit === Unit.Day &&
        // has uniform days?
        !(markerInternals && (markerInternals as any).epochNanoseconds)
      )
    ) {
      return totalDayTimeDuration(slots, totalUnit as DayTimeUnit)
    }

    if (!markerInternals) {
      throw new RangeError('need relativeTo')
    }

    const markerSystem = createMarkerSystem(markerInternals) as MarkerSystem<unknown>

    return totalRelativeDuration(
      ...spanDuration(slots, undefined, totalUnit, ...markerSystem),
      totalUnit,
      ...(markerSystem as unknown as SimpleMarkerSystem<unknown>),
    )
  }

  toString(options?: TimeDisplayOptions): string {
    return durationToString(getDurationSlots(this), options)
  }

  toJSON(): string {
    return durationToString(getDurationSlots(this))
  }

  get blank(): boolean {
    return !getDurationSlots(this).sign
  }

  static from(arg: DurationArg): Duration {
    return createDuration(toDurationSlots(arg))
  }

  static compare(
    durationArg0: DurationArg,
    durationArg1: DurationArg,
    options?: RelativeToOptions,
  ): NumSign {
    const durationFields0 = toDurationSlots(durationArg0)
    const durationFields1 = toDurationSlots(durationArg1)
    const markerInternals = refineRelativeToOptions(options)
    const largestUnit = Math.max(
      getLargestDurationUnit(durationFields0),
      getLargestDurationUnit(durationFields1),
    ) as Unit

    // fast-path if fields identical
    if (
      durationFields0.years === durationFields1.years &&
      durationFields0.months === durationFields1.months &&
      durationFields0.weeks === durationFields1.weeks &&
      durationFields0.days === durationFields1.days &&
      durationFields0.hours === durationFields1.hours &&
      durationFields0.minutes === durationFields1.minutes &&
      durationFields0.seconds === durationFields1.seconds &&
      durationFields0.milliseconds === durationFields1.milliseconds &&
      durationFields0.microseconds === durationFields1.microseconds &&
      durationFields0.nanoseconds === durationFields1.nanoseconds
    ) {
      return 0
    }

    if (
      largestUnit < Unit.Day || (
        largestUnit === Unit.Day &&
        // has uniform days?
        !(markerInternals && (markerInternals as any).epochNanoseconds)
      )
    ) {
      return compareDayTimeNanos(
        givenFieldsToDayTimeNano(durationFields0, Unit.Day, durationFieldNamesAsc),
        givenFieldsToDayTimeNano(durationFields1, Unit.Day, durationFieldNamesAsc)
      )
    }

    if (!markerInternals) {
      throw new RangeError('need relativeTo')
    }

    const [marker, markerToEpochNano, moveMarker] = createMarkerSystem(markerInternals) as MarkerSystem<unknown>

    return compareDayTimeNanos(
      markerToEpochNano(moveMarker(marker, durationFields0)),
      markerToEpochNano(moveMarker(marker, durationFields1)),
    )
  }
}

defineStringTag(Duration.prototype, DurationBranding)

defineProps(Duration.prototype, {
  valueOf: neverValueOf,
})

defineGetters(
  Duration.prototype,
  durationGettersMethods,
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createDuration(slots: DurationSlots): Duration {
  return createViaSlots(Duration, slots)
}

export function getDurationSlots(duration: Duration): DurationSlots {
  return getSpecificSlots(DurationBranding, duration) as DurationSlots
}

export function toDurationSlots(arg: DurationArg): DurationSlots {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots && slots.branding === DurationBranding) {
      return slots as DurationSlots
    }
    return { ...refineDurationBag(arg as DurationBag), branding: DurationBranding }
  }
  return { ...parseDuration(ensureString(arg)), branding: DurationBranding }
}

function addToDuration(
  direction: -1 | 1,
  internals: DurationInternals,
  otherArg: DurationArg,
  options: RelativeToOptions | undefined,
): Duration {
  let otherFields = toDurationSlots(otherArg) as DurationInternals
  const markerInternals = refineRelativeToOptions(options) // optional
  const largestUnit = Math.max(
    getLargestDurationUnit(internals),
    getLargestDurationUnit(otherFields),
  ) as Unit

  if (
    largestUnit < Unit.Day || (
      largestUnit === Unit.Day &&
      // has uniform days?
      !(markerInternals && (markerInternals as any).epochNanoseconds)
    )
  ) {
    return createDuration({
      branding: DurationBranding,
      ...updateDurationFieldsSign(
        addDayTimeDurationFields(internals, otherFields, direction, largestUnit as DayTimeUnit)
      )
    })
  }

  if (!markerInternals) {
    throw new RangeError('relativeTo is required for years, months, or weeks arithmetic')
  }

  if (direction === -1) {
    otherFields = negateDurationInternals(otherFields)
  }

  const markerSystem = createMarkerSystem(markerInternals) as MarkerSystem<unknown>
  return createDuration({
    branding: DurationBranding,
    ...spanDuration(
      internals,
      otherFields,
      largestUnit,
      ...markerSystem,
    )[0]
  })
}

// Utils
// -------------------------------------------------------------------------------------------------

function spanDuration<M>(
  durationFields0: DurationFields,
  durationFields1: DurationFields | undefined, // HACKy
  largestUnit: Unit, // TODO: more descrimination?
  // marker system...
  marker: M,
  markerToEpochNano: MarkerToEpochNano<M>,
  moveMarker: MoveMarker<M>,
  diffMarkers: DiffMarkers<M>,
): [
  DurationInternals,
  DayTimeNano,
] {
  let endMarker = moveMarker(marker, durationFields0)

  if (durationFields1) {
    endMarker = moveMarker(endMarker, durationFields1)
  }

  let balancedDuration = diffMarkers(marker, endMarker, largestUnit)

  return [
    updateDurationFieldsSign(balancedDuration), // yuck
    markerToEpochNano(endMarker),
  ]
}

// TODO: DRY
function getLargestDurationUnit(fields: DurationFields): Unit {
  let unit: Unit = Unit.Year

  for (; unit > Unit.Nanosecond; unit--) {
    if (fields[durationFieldNamesAsc[unit]]) {
      break
    }
  }

  return unit
}

function durationToString(slots: DurationInternals, options?: TimeDisplayOptions): string {
  const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options, Unit.Second)

  // for performance AND for not losing precision when no rounding
  if (nanoInc > 1) {
    slots = updateDurationFieldsSign({
      ...slots,
      ...balanceDayTimeDuration(
        slots,
        Math.min(getLargestDurationUnit(slots), Unit.Day),
        nanoInc,
        roundingMode,
      ),
    })
  }

  return formatDurationInternals(
    slots,
    subsecDigits as (SubsecDigits | undefined), // -1 won't happen (units can't be minutes)
  )
}
