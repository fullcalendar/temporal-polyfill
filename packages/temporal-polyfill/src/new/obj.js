
export function isObjectLike() {

}

export function mapProps() {

}

export function remapProps(obj, oldKeys, newKeys) {

}

export function defineProps(obj, props) {
  return Object.defineProperties(
    obj,
    mapProps(props, (value) => ({
      value,
      writable: true,
      configurable: true,
    })),
  )
}

export function pluckProps(obj, props) {
}

export function removeDuplicateStrings(a0, a1) {

}
