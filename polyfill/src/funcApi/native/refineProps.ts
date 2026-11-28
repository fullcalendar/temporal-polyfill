import { isObjectLike } from '../../internal/utils'

/*
How the native branch hands objects to native Temporal
-----------------------------------------------------------------------------
Native doesn't understand function-API records, so some wrappers have to change
a property before passing an options or fields object on, such as swapping a
record for its native object or checking a time zone ID. They do that on a copy
made in one pass, never on the caller's object.

Both branches of the function API must accept the same objects and produce the
same results. So the copy keeps every enumerable property, including ones
inherited through a prototype, which the shim branch reads like any other. A
spread would drop those.

Each property of the caller's object is read exactly once. Unlike the shim
branch, the copy reads them all up front, in key order, rather than in the
order the spec reads them. That departure is deliberate.

A missing or non-object value passes through unchanged, so native reports it
the way it would have anyway (undefined is allowed, null throws a TypeError).
*/

/*
Copies the props, then replaces the value at each of the refiners' keys with
that refiner's result, called with the copied value. With no refiners, it's a
plain one-pass copy.
*/
export function refineProps<P, R extends RefinerMap<P>>(
  props: P,
  refiners: R,
): RefinedProps<P, R> {
  if (!isObjectLike(props)) {
    return props as any
  }

  const copy: any = {}
  for (const key in props) {
    copy[key] = props[key]
  }
  for (const key in refiners) {
    copy[key] = refiners[key]!(copy[key])
  }
  return copy
}

// Types
// -----------------------------------------------------------------------------

type RefinerMap<P> = {
  [K in keyof NonNullable<P>]?: (value: NonNullable<P>[K]) => unknown
}

type RefinedProps<P, R> = Omit<NonNullable<P>, keyof R> & {
  [K in keyof R]: R[K] extends (value: any) => infer V ? V : never
}
