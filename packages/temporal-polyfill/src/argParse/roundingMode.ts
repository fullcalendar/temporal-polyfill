import { RoundingFunc } from '../utils/math'
import { createOptionParser } from './refine'

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

// TODO: start using ENUM-like types. It's bad to have caller code referencing Math.* functions

export const parseRoundingModeOption = createOptionParser(
  'roundingMode',
  roundingModeMap,
  // TODO: always default to Math.trunc?
)
