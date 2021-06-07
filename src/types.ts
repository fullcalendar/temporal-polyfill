import { DurationUnit } from './duration'

export type LocaleId = 'en-US'

export type RoundMode = 'halfExpand' | 'ceil' | 'trunc' | 'floor'
export type RoundOptions = {
  smallestUnit: DurationUnit | 'auto'
  largestUnit: DurationUnit | 'auto'
  roundingIncrement: number
  roundingMode: RoundMode
}
export type RoundOptionsLike = Partial<RoundOptions>

export type AssignmentOptions = { overflow: 'constrain' | 'reject' }
export type AssignmentOptionsLike = Partial<AssignmentOptions>

export type CompareReturn = -1 | 0 | 1

export enum UNIT_INCREMENT {
  MILLISECOND = 1,
  SECOND = 1000,
  MINUTE = 60,
  HOUR = 60,
  DAY = 24,
  WEEK = 7,
  /** @deprecated This increment should not be used, it should instead defer to a calendar */
  MONTH = 4.34524,
  /** @deprecated This increment should not be used, it should instead defer to a calendar */
  YEAR = 12,
}

/** Constructs a type with specified properties set to required and the rest as optional */
export type Part<A, B extends keyof A> = Required<Pick<A, B>> & Partial<A>
