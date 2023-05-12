
export function isObjectLike() {

}

export function mapProps() {

}

export function remapProps(obj, oldKeys, newKeys) {

}

export function pluckProps(obj, props) {
}

export function removeDuplicateStrings(a0, a1) {

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
