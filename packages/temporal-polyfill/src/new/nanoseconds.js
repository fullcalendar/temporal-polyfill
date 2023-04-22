export const nanosecondsInMicrosecond = 1000
export const nanosecondsInMillisecond = 1000000
export const nanosecondsInSecond = 1000000000
export const nanosecondsInMinute = 60000000000 // used?
export const nanosecondsInHour = 3600000000000
export const nanosecondsInDay = 86400000000000 // used?

export const epochGetters = {
  epochNanoseconds(epochNanoseconds) {
    return epochNanoseconds.toBigInt()
  },

  epochMicroseconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInMicrosecond).toBigInt()
  },

  epochMilliseconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInMillisecond).toBigInt()
  },

  epochSeconds(epochNanoseconds) {
    return epochNanoseconds.div(nanosecondsInSecond).toBigInt()
  },
}

export function regulateEpochNanoseconds(epochNanoseconds) {

}

export function isoTimeFieldsToNanoseconds() {

}

export function nanosecondsToIsoTimeFields() {
  // return [isoTimeFields, dayDelta]
}
