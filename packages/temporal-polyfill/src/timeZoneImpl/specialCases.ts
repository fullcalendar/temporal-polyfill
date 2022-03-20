import { RawTransition } from './timeZoneImpl'

export const specialCases: {
  [timeZoneID: string]: { [year: string]: RawTransition[] }
} = {
  'Pacific/Apia': {
    2011: [
      // TODO: this was much nicer when specified in seconds
      // TODO: have RawTransitions be seconds again?
      [1301752800000000000n, -36000000000000, -39600000000000], // start DST
      [1316872800000000000n, -39600000000000, -36000000000000], // end DST
      [1325239200000000000n, -36000000000000, 50400000000000], // change of time zone
    ],
  },
}
