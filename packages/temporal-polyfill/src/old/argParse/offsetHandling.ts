import { createOptionParser } from './refine'

export const OFFSET_PREFER = 0
export const OFFSET_USE = 1
export const OFFSET_IGNORE = 2
export const OFFSET_REJECT = 3
export type OffsetHandlingInt = 0 | 1 | 2 | 3

export interface OffsetHandlingMap {
  prefer: 0
  use: 1
  ignore: 2
  reject: 3
}
export const offsetHandlingMap: OffsetHandlingMap = {
  prefer: 0,
  use: 1,
  ignore: 2,
  reject: 3,
}

export const parseOffsetHandlingOption = createOptionParser(
  'offset',
  offsetHandlingMap,
)
