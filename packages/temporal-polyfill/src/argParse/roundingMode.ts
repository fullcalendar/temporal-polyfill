import { RoundingFunc } from '../utils/math'
import { createParser } from './refine'

export interface RoundingModeMap {
  halfExpand: RoundingFunc
  ceil: RoundingFunc
  trunc: RoundingFunc
  floor: RoundingFunc
}

const roundingModeMap: RoundingModeMap = {
  halfExpand: Math.round,
  ceil: Math.ceil,
  trunc: Math.trunc,
  floor: Math.floor,
}

export const parseRoundingMode = createParser(
  'roundingMode',
  roundingModeMap,
  // TODO: always default to Math.trunc?
)
