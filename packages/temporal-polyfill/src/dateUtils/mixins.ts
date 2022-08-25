import { Temporal } from 'temporal-spec'
import { unitNames } from '../argParse/unitStr'
import { LargeInt } from '../utils/largeInt'
import { attachGetters, strArrayToHash } from '../utils/obj'
import { capitalizeFirstLetter } from '../utils/string'
import { DateISOInstance } from './calendar'
import { epochNanoSymbol } from './epoch'
import { nanoInMicro, nanoInMilli, nanoInSecond } from './units'

// Epoch Fields

export interface ComputedEpochFields {
  epochNanoseconds: bigint
  epochMicroseconds: bigint
  epochMilliseconds: number
  epochSeconds: number
}

export function mixinEpochFields<Obj extends { [epochNanoSymbol]: LargeInt }>(
  ObjClass: { prototype: Obj },
): void {
  attachGetters(ObjClass, {
    epochNanoseconds(): bigint {
      return this[epochNanoSymbol].toBigInt()
    },
    epochMicroseconds(): bigint {
      return this[epochNanoSymbol].div(nanoInMicro).toBigInt()
    },
    epochMilliseconds(): number {
      return this[epochNanoSymbol].div(nanoInMilli).toNumber()
    },
    epochSeconds(): number {
      return this[epochNanoSymbol].div(nanoInSecond).toNumber()
    },
  })
}

// ISO Fields

const isoFieldMap: { [Key: string]: string } = {
  calendar: 'calendar',
}
for (const unitName of unitNames) {
  isoFieldMap[unitName] = 'iso' + capitalizeFirstLetter(unitName)
}

// always mixes in `calendar`
export function mixinISOFields<Obj extends { getISOFields(): any }>(
  ObjClass: { prototype: Obj },
  unitNames: Temporal.DateTimeUnit[] = [],
): void {
  attachGetters(
    ObjClass,
    strArrayToHash(
      (unitNames as string[]).concat('calendar'),
      (propName) => function(this: Obj) {
        return this.getISOFields()[isoFieldMap[propName]]
      },
    ),
  )
}

// Calendar Fields

export interface YearMonthCalendarFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: number
  monthCode: string
  daysInMonth: number
  daysInYear: number
  monthsInYear: number
  inLeapYear: boolean
}

export interface MonthDayCalendarFields {
  monthCode: string
  day: number
}

export interface DateCalendarFields extends YearMonthCalendarFields {
  day: number
  daysInWeek: number
  dayOfWeek: number
  dayOfYear: number
  weekOfYear: number
}

export const yearMonthCalendarFields: (keyof YearMonthCalendarFields)[] = [
  'era',
  'eraYear',
  'year',
  'month',
  'monthCode',
  'daysInMonth',
  'daysInYear',
  'monthsInYear',
  'inLeapYear',
]

export const monthDayCalendarFields: (keyof MonthDayCalendarFields)[] = [
  'monthCode',
  'day',
]

export const dateCalendarFields: (keyof DateCalendarFields)[] = [
  ...yearMonthCalendarFields,
  'day',
  'dayOfWeek',
  'dayOfYear',
  'weekOfYear',
  'daysInWeek',
]

export function mixinCalendarFields<Obj extends DateISOInstance>(
  ObjClass: { prototype: Obj },
  propNames: (keyof DateCalendarFields)[],
): void {
  attachGetters(
    ObjClass,
    strArrayToHash(propNames, (propName) => function(this: Obj) {
      const value = this.calendar[propName as keyof DateCalendarFields](
        this as Temporal.PlainDateLike,
      )
      Object.defineProperty(this, propName, { value }) // cache the value on the object
      return value
    }),
  )
}

// affects how objects are displayed in console

// TODO: make readonly somehow?
export function attachStringTag(objOrClass: any, name: string): void {
  (objOrClass.prototype || objOrClass)[Symbol.toStringTag] = 'Temporal.' + name
}
