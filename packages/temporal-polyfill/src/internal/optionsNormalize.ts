import { requireObjectLike } from './cast'

/*
Whole-options normalization only.

This file answers the question "what object should option reads come from?"
without reading individual Temporal option properties. That separation matters
because option property access is observable, and the caller-specific
`refine*Options` functions still own the exact read order and validation order.
*/

export function normalizeOptions<O extends {}>(options: O | undefined): O {
  if (options === undefined) {
    // Avoid inherited option properties from Object.prototype pollution.
    return Object.create(null)
  }
  return requireObjectLike(options)
}

export function normalizeOptionsOrString<
  O extends {},
  K extends string & keyof O,
>(options: O | O[K], optionName: K): O {
  if (typeof options === 'string') {
    return createOptionsObject(optionName, options as O[K])
  }
  return requireObjectLike(options as O)
}

function createOptionsObject<O extends {}, K extends string & keyof O>(
  optionName: K,
  optionVal: O[K],
): O {
  // Avoid inherited option properties from Object.prototype pollution.
  const res = Object.create(null)
  res[optionName] = optionVal
  return res
}
