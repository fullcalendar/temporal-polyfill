
export function largestOfTwoUnits() {

}

export function toOffsetHandling() {

}

export function toDisambiguation() {

}

export function toLargestUnit() {

}

export function toSmallestUnit() {
}

export function isTimeUnit(unit) {
  return unit !== 'year' &&
    unit !== 'month' &&
    unit !== 'week' &&
    unit !== 'day'
}

export function toCalendarNameOption() {

}

export function toDiffOptions() {

}

export function toOverflowOptions() {

}

export function validateRoundingOptions(options) {
  /*
    if (roundTo === undefined) throw new TypeError('options parameter is required');
    if (ES.Type(roundTo) === 'String') {
      const stringParam = roundTo;
      roundTo = ObjectCreate(null);
      roundTo.smallestUnit = stringParam;
    } else {
      roundTo = ES.GetOptionsObject(roundTo);
    }
    const roundingIncrement = ES.ToTemporalRoundingIncrement(roundTo);
    const roundingMode = ES.ToTemporalRoundingMode(roundTo, 'halfExpand');
    const smallestUnit = ES.GetTemporalUnit(roundTo, 'smallestUnit', 'time', ES.REQUIRED, ['day']);
    const maximumIncrements = {
      day: 1,
      hour: 24,
      minute: 60,
      second: 60,
      millisecond: 1000,
      microsecond: 1000,
      nanosecond: 1000
    };
    const maximum = maximumIncrements[smallestUnit];
    const inclusive = maximum === 1;
    ES.ValidateTemporalRoundingIncrement(roundingIncrement, maximum, inclusive);
  */
}

export function optionsToLargestUnit() {
}

export function optionsToOverflow() {
}
