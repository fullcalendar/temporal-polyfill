import { unitNames } from '../argParse/unitStr'
import { Calendar } from '../public/calendar'
import { PlainDate } from '../public/plainDate'
import { DateUnit } from '../public/types'
import { DiffableObj, diffAccurate } from './diff'
import { DurationFields, overrideDuration } from './durationFields'
import { DAY, DateUnitInt, UnitInt, WEEK } from './units'

export function spanDurationFrom(
  duration: DurationFields,
  largestUnit: UnitInt,
  relativeTo: DiffableObj,
  calendar: Calendar,
): DurationFields {
  return (
    relativeTo instanceof PlainDate
      ? spanDurationFromDate(
        duration,
        Math.max(DAY, largestUnit) as DateUnitInt,
        relativeTo,
        calendar,
      )
      : spanDurationFromDateTime(duration, largestUnit, relativeTo, calendar)
  )[0]
}

// does not need to worry about time fields at all! or dst!
// only worries about date fields. can rely completely on calendar
export function spanDurationFromDate(
  duration: DurationFields,
  largestUnit: DateUnitInt,
  relativeTo: DiffableObj,
  calendar: Calendar,
): [DurationFields, DiffableObj] {
  const translated = relativeTo.add(duration)
  const newDuration = calendar.dateUntil(relativeTo, translated, {
    largestUnit: unitNames[largestUnit] as DateUnit,
  })

  return [newDuration, translated]
}

export function spanDurationFromDateTime(
  fields: DurationFields,
  largestUnit: UnitInt,
  relativeTo: DiffableObj,
  calendar: Calendar,
  dissolveWeeks?: boolean,
): [DurationFields, DiffableObj] {
  // balancing does not care about weeks
  // TODO: make this more readable. responsibility of caller?
  const forcedWeeks = dissolveWeeks !== true && largestUnit > WEEK && fields.weeks
  if (forcedWeeks) {
    fields = overrideDuration(fields, { weeks: 0 })
  }

  let translated = relativeTo.add(fields)

  // ***uses calendar.dateUntil under the hood
  let balancedDuration = diffAccurate(relativeTo, translated, calendar, largestUnit)

  // add weeks back in
  if (forcedWeeks) {
    balancedDuration = overrideDuration(balancedDuration, { weeks: forcedWeeks })
    translated = translated.add({ weeks: forcedWeeks })
  }

  return [balancedDuration, translated]
}
