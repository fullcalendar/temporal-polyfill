
export function isObjectLike() {
}

export function mapRefiners(input, refinerMap) {
  // loops get driven props of input
}

export function mapProps(input, refinerMap) {
  // loops get driven my refinerMap
}

export function remapProps(obj, oldKeys, newKeys) {
}

export function pluckProps(obj, props) {
}

export function removeDuplicateStrings(a0, a1) {
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

export function zipSingleValue() {
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

export function positiveModulo(n, max) {
  return (n % max + max) % max
}

export function twoDigit(num) { // as a string
}

export function compareNumbers() {
}

export function clamp() {
}

export function isIdPropsEqual(obj0, obj1) {
}
