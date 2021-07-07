import { CompareReturn } from './utils'

export type PlainDateFields = {
  isoYear: number
  isoMonth: number
  isoDay: number
}

export class PlainDate {
  constructor(
    readonly isoYear: number,
    readonly isoMonth: number,
    readonly isoDay: number
  ) {}

  static compare(one: PlainDate, two: PlainDate): CompareReturn {
    const diff =
      one.isoYear - two.isoYear ||
      one.isoMonth - two.isoMonth ||
      one.isoDay - two.isoDay

    return diff !== 0 ? (diff < 0 ? -1 : 1) : 0
  }
}
