import { nanoInMilli } from '../dateUtils/units'
import { LargeInt, createLargeInt } from '../utils/largeInt'
import { RawTransition } from './timeZoneImpl'

export const specialCases: {
  [timeZoneID: string]: { [year: string]: RawTransition[] }
} = {
  'Pacific/Apia': {
    2011: [
      // TODO: this was much nicer when specified in seconds
      // TODO: have RawTransitions be seconds again?
      [toNano(1301752800000), -36000000000000, -39600000000000], // start DST
      [toNano(1316872800000), -39600000000000, -36000000000000], // end DST
      [toNano(1325239200000), -36000000000000, 50400000000000], // change of time zone
    ],
  },
}

function toNano(milli: number): LargeInt {
  return createLargeInt(milli).mult(nanoInMilli)
}
