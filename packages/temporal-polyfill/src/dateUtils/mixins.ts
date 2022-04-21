import { unitNames } from '../argParse/unitStr'
import { Calendar } from '../public/calendar'
import { Unit } from '../public/types'
import { Temporal } from '../spec'
import { attachGetters, strArrayToHash } from '../utils/obj'
import { capitalizeFirstLetter } from '../utils/string'
import { DateISOInstance } from './calendar'
import { nanoInMicroBI, nanoInMilliBI, nanoInSecondBI } from './units'

// Epoch Fields

export interface ComputedEpochFields {
  epochMicroseconds: bigint
  epochMilliseconds: number
  epochSeconds: number
}

export function mixinEpochFields<Obj extends { epochNanoseconds: bigint }>(
  ObjClass: { prototype: Obj },
): void {
  attachGetters(ObjClass, {
    epochMicroseconds(): bigint {
      return this.epochNanoseconds / nanoInMicroBI
    },
    epochMilliseconds(): number {
      return Number(this.epochNanoseconds / nanoInMilliBI)
    },
    epochSeconds(): number {
      return Number(this.epochNanoseconds / nanoInSecondBI)
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
  unitNames: Unit[] = [],
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
  daysInWeek: number
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
  propNames: (keyof Calendar)[],
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

export function attachStringTag(objOrClass: any, name: string): void {
  (objOrClass.prototype || objOrClass)[Symbol.toStringTag] = 'Temporal.' + name
}
