
const objectlikeRE = /object|function/

export function isObjectlike(arg) {
  return arg !== null && objectlikeRE.test(typeof arg)
}

export function mapProps(transformer, props, extraArg) {
  const res = {}

  for (const propName in props) {
    res[propName] = transformer(props[propName], propName, extraArg)
  }

  return res
}

export const mapPropsWithRefiners = mapProps.bind(
  undefined,
  (propValue, propName, refinerMap) => refinerMap[propName](propValue, propName),
)

export function mapPropNames(generator, propNames, extraArg) {
  const res = {}

  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    res[propName] = generator(propName, i, extraArg)
  }

  return res
}

export const mapPropNamesToIndex = mapPropNames.bind(
  undefined,
  (propName, index) => index,
)

export const mapPropNamesToConstant = mapPropNames.bind(
  undefined,
  (propName, index, extraArg) => extraArg,
)

export function remapProps(oldKeys, newKeys, props) {
  const res = {}

  for (let i = 0; i < oldKeys.length; i++) {
    res[newKeys[i]] = props[oldKeys[i]]
  }

  return res
}

export function pluckProps(propNames, props) {
  const res = {}

  for (const propName of propNames) {
    res[propName] = props[propName]
  }

  return res
}

export function excludeArrayDuplicates(a) {
  return [...new Set(a)]
}

function filterProps(filterFunc, props, extraArg) {
  const res = {}

  for (const propName in props) {
    const propValue = props[propName]

    if (filterFunc(propValue, propName, extraArg)) {
      res[propName] = propValue
    }
  }

  return res
}

export const excludeUndefinedProps = filterProps.bind(
  undefined,
  (propValue) => propValue !== undefined,
)

export const excludePropsByName = filterProps.bind(
  undefined,
  (propValue, propName, nameSet) => !nameSet.has(propName),
)

export function hasAnyPropsByName(props, names) {
  for (const name of names) {
    if (props[name] !== undefined) {
      return true
    }
  }
  return false
}

export function hasAllPropsByName(props, names) {
  for (const name of names) {
    if (props[name] === undefined) {
      return false
    }
  }
  return true
}

export function createLazyGenerator(generator, MapClass = Map) {
  const map = new MapClass()

  return (key, ...otherArgs) => {
    if (map.has(key)) {
      return map.get(key)
    } else {
      const val = generator(key, ...otherArgs)
      map.set(key, val)
      return val
    }
  }
}

// descriptor stuff
// ----------------

export function defineProps(target, propVals) {
  return Object.defineProperties(target, createPropDescriptors(propVals))
}

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

export function padNumber(num, digits) {
  return num.padStart(digits, '0')
}

export function compareNumbers(a, b) {
  return Math.sign(a - b)
}

export function compareProps(propNames, props0, props1) {
  for (const propName of propNames) {
    const cmp = compareNumbers(props0[propName], props1[propName])
    if (cmp) {
      return cmp
    }
  }
  return 0
}

export function clamp(
  val,
  min, // inclusive
  max, // inclusive
  throwOnOverflow, // 0/1 (matched constrain/reject)
  noun, // for error message (required if throwOnOverflow given)
) {
  const clamped = Math.min(Math.max(val, min), max)

  if (throwOnOverflow && val !== clamped) {
    throw new RangeError(`${noun} must be between ${min}-${max}`)
  }

  return clamped
}

/*
Works with BigInt or Number (as long as the same)
*/
export function divFloorMod(n, divisor) {
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

// rounding
// --------

export function roundExpand(n) {
  return n < 0 ? Math.floor(n) : Math.ceil(n)
}

export function roundHalfFloor(n) {
  return hasHalf(n) ? Math.floor(n) : Math.round(n)
}

export function roundHalfCeil(n) {
  return hasHalf(n) ? Math.ceil(n) : Math.round(n)
}

export function roundHalfTrunc(n) {
  return hasHalf(n) ? Math.trunc(n) : Math.round(n)
}

export function roundHalfEven(n) {
  return hasHalf(n)
    ? (n = Math.trunc(n)) + (n % 2)
    : Math.round(n)
}

function hasHalf(n) {
  return Math.abs(n % 1) === 0.5
}
