import { Temporal } from 'temporal-spec'
import { unitNames } from '../argParse/unitStr'
import { LargeInt } from '../utils/largeInt'
import { attachGetters, strArrayToHash } from '../utils/obj'
import { capitalizeFirstLetter } from '../utils/string'
import { needReceiver } from './abstract'
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
  ObjClass: { new(...constructorArgs: any[]): Obj },
): void {
  attachGetters(ObjClass, {
    epochNanoseconds(): bigint {
      needReceiver(ObjClass, this)
      return this[epochNanoSymbol].toBigInt()
    },
    epochMicroseconds(): bigint {
      needReceiver(ObjClass, this)
      return this[epochNanoSymbol].div(nanoInMicro).toBigInt()
    },
    epochMilliseconds(): number {
      needReceiver(ObjClass, this)
      return this[epochNanoSymbol].div(nanoInMilli).toNumber()
    },
    epochSeconds(): number {
      needReceiver(ObjClass, this)
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
  ObjClass: { new(...constructorArgs: any[]): Obj },
  unitNames: Temporal.DateTimeUnit[] = [],
): void {
  attachGetters(
    ObjClass,
    strArrayToHash(
      (unitNames as string[]).concat('calendar'),
      (propName) => function(this: Obj) {
        needReceiver(ObjClass, this)
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
  yearOfWeek: number
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
  'yearOfWeek',
  'daysInWeek',
]

export function mixinCalendarFields<Obj extends DateISOInstance>(
  ObjClass: { new(...constructorArgs: any[]): Obj },
  propNames: (keyof DateCalendarFields)[],
): void {
  attachGetters(
    ObjClass,
    strArrayToHash(propNames, (propName) => function(this: Obj) {
      needReceiver(ObjClass, this)
      const calendar = this.calendar
      const value = calendar[propName as keyof DateCalendarFields](
        this as Temporal.PlainDateLike,
      )

      switch (propName) {
        case 'inLeapYear':
          if (typeof value !== 'boolean') {
            throw new TypeError('Must be boolean')
          }
          break
        case 'monthCode':
          if (typeof value !== 'string') {
            throw new TypeError('Must be string')
          }
          break
        case 'era':
          if (value !== undefined) {
            if (typeof value !== 'string') {
              throw new TypeError('bad era')
            }
          }
          break
        case 'eraYear':
          if (value !== undefined) {
            if (typeof value !== 'number') {
              throw new TypeError('bad number')
            }
            if (!Number.isInteger(value)) {
              throw new RangeError('bad range')
            }
          }
          break
        default:
          if (typeof value !== 'number') {
            throw new TypeError('bad number')
          }
          if (!Number.isInteger(value)) {
            throw new RangeError('bad range')
          }
          if (propName !== 'year' && value <= 0) {
            throw new RangeError('bad range')
          }
      }

      Object.defineProperty(this, propName, { // cache the value on the object
        value,
        configurable: true, // what classes do. TODO: ensure everywhere
      })
      return value
    }),
  )
}

// affects how objects are displayed in console

// TODO: make readonly somehow?
export function attachStringTag(objOrClass: any, name: string): void {
  Object.defineProperty(
    objOrClass.prototype || objOrClass,
    Symbol.toStringTag, {
      value: 'Temporal.' + name,
      configurable: true,
    },
  )
}
