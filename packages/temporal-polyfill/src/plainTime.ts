import { AssignmentOptions, CompareReturn } from './utils/types'

export type PlainTimeFields = {
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}

export class PlainTime {
  constructor(
    readonly isoHour: number = 0,
    readonly isoMinute: number = 0,
    readonly isoSecond: number = 0,
    readonly isoMillisecond: number = 0
  ) {}

  get hour(): number {
    return this.isoHour
  }

  get minute(): number {
    return this.isoMinute
  }

  get second(): number {
    return this.isoSecond
  }

  get millisecond(): number {
    return this.isoMillisecond
  }

  static compare(one: PlainTime, two: PlainTime): CompareReturn {
    const diff =
      one.isoHour - two.isoHour ||
      one.isoMinute - two.isoMinute ||
      one.isoSecond - two.isoSecond ||
      one.isoMillisecond - two.isoMillisecond

    return diff !== 0 ? (diff < 0 ? -1 : 1) : 0
  }

  with(timeLike: Partial<PlainTime>, options?: AssignmentOptions): PlainTime {
    return new PlainTime(
      timeLike.isoHour || this.isoHour,
      timeLike.isoMinute || this.isoMinute,
      timeLike.isoSecond || this.isoSecond,
      timeLike.isoMillisecond || this.isoMillisecond
    )
  }

  equals(other: PlainTime): boolean {
    return (
      this.isoHour === other.isoHour &&
      this.isoMinute === other.isoMinute &&
      this.isoSecond === other.isoSecond &&
      this.isoMillisecond === other.isoMillisecond
    )
  }

  getISOFields(): PlainTimeFields {
    return {
      isoHour: this.isoHour,
      isoMinute: this.isoMinute,
      isoSecond: this.isoSecond,
      isoMillisecond: this.isoMillisecond,
    }
  }
}
