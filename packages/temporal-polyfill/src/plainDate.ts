import { CompareReturn } from './utils/types'

export type PlainDateFields = {
  isoYear: number
  isoMonth: number
  isoDay: number
}

export type PlainDateLike = Partial<PlainDateFields>

export class PlainDate {
  constructor(
    readonly isoYear: number,
    readonly isoMonth: number,
    readonly isoDay: number
  ) {}

  // TODO: Make this function
  static from(thing: unknown): PlainDate {
    return new PlainDate(1970, 1, 1)
  }

  static compare(one: PlainDate, two: PlainDate): CompareReturn {
    const diff =
      one.isoYear - two.isoYear ||
      one.isoMonth - two.isoMonth ||
      one.isoDay - two.isoDay

    return diff !== 0 ? (diff < 0 ? -1 : 1) : 0
  }

  with(dateLike: PlainDateLike | string): PlainDate {
    if (typeof dateLike === 'string') {
      throw new Error('Unimplemented')
    }
    return new PlainDate(
      dateLike.isoYear ?? this.isoYear,
      dateLike.isoMonth ?? this.isoMonth,
      dateLike.isoDay ?? this.isoDay
    )
  }
}
