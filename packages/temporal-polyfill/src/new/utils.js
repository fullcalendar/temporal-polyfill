
// in general, prefer .bind over macro functions

// monitor use of floor/trunc and modding. many are wrong

export function isObjectLike() {
}

export function mapRefiners(input, refinerMap) {
  // loops get driven props of input
}

export function mapProps(input, refinerMap) {
  // loops get driven my refinerMap
}

export function mapArrayToProps() { // propNameToProps
}

export function remapProps(obj, oldKeys, newKeys) {
  // TODO: put key args in front so can use bind?
}

export function pluckProps(propNames, obj) {
}

export function removeDuplicateStrings(a0, a1) {
  // if we use a Set(), can be generalized away from just strings!!!
}

export function removeUndefines(obj) { // and copy
}

export function buildWeakMapCache() {
}

export function createLazyMap() {
}

export function excludeProps(options, propNames) {
}

export function hasAnyMatchingProps(props, propNames) {
}

export function hasAllMatchingProps(props, propNames) {
}

export function zipSingleValue() {
}

export function defineProps(target, propVals) {
  return Object.defineProperties(target, createPropDescriptors(propVals))
}

// descriptor stuff
// ----------------

export function createPropDescriptors(props) {
  return mapProps(props, (value) => ({
    value,
    configurable: true,
    writable: true,
  }))
}

export function createGetterDescriptors(getters) {
  return mapProps(getters, (getter) => ({
    get: getter,
    configurable: true,
  }))
}

export function createTemporalNameDescriptors(temporalName) {
  return {
    [Symbol.toStringTag]: {
      value: 'Temporal.' + temporalName,
      configurable: true,
    },
  }
}

// former lang
// -----------

export function identityFunc(thing) {
  return thing
}

export function noop() {
}

export function twoDigit(num) { // as a string
}

export function compareNumbers() {
}

export function clamp() {
}

/*
Works with BigInt or Number (as long as the same)
*/
export function divMod(n, divisor) {
  const remainder = floorMod(n, divisor)
  const quotient = (n - remainder) / divisor
  return [quotient, remainder]
}

/*
Works with BigInt or Number (as long as the same)
*/
export function floorMod(n, divisor) {
  return (n % divisor + divisor) % divisor
}
