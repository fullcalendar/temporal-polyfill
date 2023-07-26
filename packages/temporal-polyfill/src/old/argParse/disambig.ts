import { createOptionParser } from './refine'

export const DISAMBIG_COMPATIBLE = 0
export const DISAMBIG_EARLIER = 1
export const DISAMBIG_LATER = 2
export const DISAMBIG_REJECT = 3
export type DisambigInt = 0 | 1 | 2 | 3

export interface DisambigMap {
  compatible: 0
  earlier: 1
  later: 2
  reject: 3
}
export const disambigMap: DisambigMap = {
  compatible: 0,
  earlier: 1,
  later: 2,
  reject: 3,
}

export const parseDisambigOption = createOptionParser(
  'disambiguation',
  disambigMap,
  DISAMBIG_COMPATIBLE,
)
