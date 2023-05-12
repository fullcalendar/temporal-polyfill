import { createInternalClass, getInternals, internalsMap } from './internalClass'
import { createTemporalNameDescriptors, isObjectLike } from './obj'

export function createTemporalClass(
  temporalName,
  constructorToInternals,
  massageOtherInternals,
  bagToInternals,
  stringToInternals,
  handleUnusedOptions,
  getters,
  methods,
  staticMembers = {},
) {
  methods.toJSON = function() {
    return String(this)
  }
  staticMembers.from = function(arg, options) {
    return createInstance(toInternals(arg, options))
  }

  const TemporalObj = createInternalClass(
    getters,
    methods,
    constructorToInternals,
    createTemporalNameDescriptors(temporalName), // extraPrototypeDescriptors
    staticMembers,
  )

  function createInstance(internals) {
    const instance = Object.create(TemporalObj.prototype)
    internalsMap.set(instance, internals)
    return instance
  }

  function toInternals(arg, options) {
    let argInternals = getInternals(arg)

    if (argInternals && !(arg instanceof TemporalObj)) {
      argInternals = massageOtherInternals(arg, argInternals)
    }

    return (!argInternals && isObjectLike(arg) && bagToInternals(arg, options)) ||
      (handleUnusedOptions(options), argInternals || stringToInternals(toString(arg)))
  }

  return [TemporalObj, createInstance, toInternals]
}
