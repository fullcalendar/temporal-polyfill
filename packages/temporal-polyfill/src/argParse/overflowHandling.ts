import { OverflowOptions } from '../public/types'
import { createParser } from './refine'

export const OVERFLOW_CONSTRAIN = 0
export const OVERFLOW_REJECT = 1
export type OverflowHandlingInt = 0 | 1

export interface OverflowHandlingMap {
  constrain: 0
  reject: 1
}
export const overflowHandlingMap: OverflowHandlingMap = {
  constrain: 0,
  reject: 1,
}

const parseOverflowHandling = createParser(
  'overflow',
  overflowHandlingMap,
  OVERFLOW_CONSTRAIN,
)

export function parseOverflowOptions(options: OverflowOptions | undefined): OverflowHandlingInt {
  return parseOverflowHandling(options?.overflow)
}
