import { RawTransition } from './timeZoneImpl'

export const specialCases: { [timeZoneID: string]: { [year: string]: RawTransition[]}} = {
  'Pacific/Apia': {
    2011: [
      [1301752800, -36000, -39600], // start DST
      [1316872800, -39600, -36000], // end DST
      [1325239200, -36000, 50400], // change of time zone
    ],
  },
}
