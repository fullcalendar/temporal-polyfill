import { CalendarDisplayMap } from '../argParse/calendarDisplay'
import { DisambigMap } from '../argParse/disambig'
import { OffsetDisplayMap } from '../argParse/offsetDisplay'
import { OffsetHandlingMap } from '../argParse/offsetHandling'
import { OverflowHandlingMap } from '../argParse/overflowHandling'
import { RoundingModeMap } from '../argParse/roundingMode'
import { TimeZoneDisplayMap } from '../argParse/timeZoneDisplay'
import { DateUnitProper, TimeUnitProper, YearMonthUnitProper } from '../argParse/unitStr'

/*
SPECIAL NOTE:
Must keep in sync with global.ts
*/

// units
// TODO: more DRY way to define deprecated units
export type TimeUnit = TimeUnitProper
| /** @deprecated */ 'hours'
| /** @deprecated */ 'minutes'
| /** @deprecated */ 'seconds'
| /** @deprecated */ 'milliseconds'
| /** @deprecated */ 'microseconds'
| /** @deprecated */ 'nanoseconds'
export type YearMonthUnit = YearMonthUnitProper
| /** @deprecated */ 'years'
| /** @deprecated */ 'months'
export type DateUnit = DateUnitProper
| /** @deprecated */ 'years'
| /** @deprecated */ 'months'
| /** @deprecated */ 'weeks'
| /** @deprecated */ 'days'
export type Unit = TimeUnit | DateUnit
export type DayTimeUnit = TimeUnit | 'day'
| /** @deprecated */ 'days'

// rounding
export type RoundingMode = keyof RoundingModeMap

// toString
export type CalendarDisplay = keyof CalendarDisplayMap
export type TimeZoneDisplay = keyof TimeZoneDisplayMap
export type OffsetDisplay = keyof OffsetDisplayMap
export type FractionalSecondDigits = 'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type DurationToStringUnit = 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
| /** @deprecated */ 'seconds'
| /** @deprecated */ 'milliseconds'
| /** @deprecated */ 'microseconds'
| /** @deprecated */ 'nanoseconds'
export type TimeToStringUnit = 'minute' | DurationToStringUnit
| /** @deprecated */ 'minutes'

export type LocalesArg = string | string[]

// setting/overriding options
export type OverflowHandling = keyof OverflowHandlingMap

// zone-related
export type Disambiguation = keyof DisambigMap
export type OffsetHandling = keyof OffsetHandlingMap
