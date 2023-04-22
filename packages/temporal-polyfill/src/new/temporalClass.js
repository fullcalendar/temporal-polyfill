import { defineProps, isObjectLike, mapProps } from './obj'

const internalsMap = new WeakMap()
export const getInternals = internalsMap.get.bind(internalsMap)

const nameSymbol = Symbol()

function noop() {}

export function createTemporalClass(
  name, // rename?
  constructorToInternals,
  nameToInternalsMap,
  bagToInternals = noop,
  stringToInternals,
  parseOptions = noop,
  getters,
  methods,
  staticMembers = {},
) {
  function TemporalObj(...args) {
    internalsMap.set(this, constructorToInternals(...args))
  }

  const proto = TemporalObj.prototype

  function createInstance(internals) {
    const instance = Object.create(proto)
    internalsMap.set(instance, internals)
    return instance
  }

  function toInternals(arg, options) {
    let argInternals = getInternals(arg)

    if (argInternals) {
      const argName = arg[nameSymbol] // might raise red flags accessing this!!!
      if (argName !== name) {
        argInternals = (nameToInternalsMap[argName] || noop)(argInternals)
      }
    }

    return (!argInternals && isObjectLike(arg) && bagToInternals(arg, options)) ||
      (parseOptions(options), argInternals || stringToInternals(toString(arg)))
  }

  function curryMethod(method) {
    return /* Object.setPrototypeOf( */ function(...args) {
      if (!(this instanceof TemporalObj)) {
        throw new TypeError('Invalid receiver')
      }
      return method.call(this, getInternals(this), ...args)
    } /* , null) */
  }

  Object.defineProperties(proto, {
    ...mapProps(getters, (getter) => ({
      get: curryMethod(getter),
      configurable: true,
    })),
    [Symbol.toStringTag]: {
      value: 'Temporal.' + name,
      configurable: true,
    },
    [nameSymbol]: { // might raise red flags accessing this!!!
      value: name,
    },
  })

  methods.toJSON = function() {
    return String(this)
  }
  staticMembers.from = function(arg, options) {
    return createInstance(toInternals(arg, options))
  }

  defineProps(proto, mapProps(methods, curryMethod))
  defineProps(TemporalObj, staticMembers)

  return [
    TemporalObj,
    createInstance,
    toInternals,
  ]
}

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}
