export const nanosecondsInMicrosecond = 1000
export const nanosecondsInMillisecond = 1000000
export const nanosecondsInSecond = 1000000000
export const nanosecondsInMinute = 60000000000 // used?
export const nanosecondsInHour = 3600000000000
export const nanosecondsInIsoDay = 86400000000000

export const nanosecondsInUnit = {} // include iso-day as well

export function epochNanoToMilli(epochNano) {
  return epochNano.div(nanosecondsInMillisecond).toNumber()
}

export const epochGetters = {
  epochNanoseconds(epochNanoseconds) {
    return epochNanoseconds.toBigInt()
  },

  epochMicroseconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInMicrosecond).toBigInt()
  },

  epochMilliseconds: epochNanoToMilli,

  epochSeconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInSecond).toNumber()
  },
}

export function regulateEpochNanoseconds(epochNanoseconds) {

}

export function isoTimeFieldsToNanoseconds() {

}

export function nanosecondsToIsoTimeFields() {
  /*
  const dayDelta = Math.floor(nanoseconds / nanosecondsInIsoDay)
  nanoseconds %= nanosecondsInIsoDay
  */
  // return [isoTimeFields, dayDelta]
}
