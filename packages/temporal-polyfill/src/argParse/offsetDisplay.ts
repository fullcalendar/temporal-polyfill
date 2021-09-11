import { createParser } from './refine'

export const OFFSET_DISPLAY_AUTO = 0
export const OFFSET_DISPLAY_NEVER = 1
export type OffsetDisplayInt = 0 | 1

export interface OffsetDisplayMap {
  auto: 0
  never: 1
}
export const offsetDisplayMap: OffsetDisplayMap = {
  auto: 0,
  never: 1,
}

export const parseOffsetDisplay = createParser(
  'offset',
  offsetDisplayMap,
  OFFSET_DISPLAY_AUTO,
)
