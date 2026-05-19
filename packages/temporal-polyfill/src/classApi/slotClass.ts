import * as errorMessages from '../internal/errorMessages'
import {
  createGetterDescriptors,
  createNameDescriptors,
  createPropDescriptors,
  createStringTagDescriptors,
  mapProps,
} from '../internal/utils'

export type BrandingAndSlots<D = object> = [branding: string, slots: D]

const slotsMap = new WeakMap<any, BrandingAndSlots<any>>()

export const getBrandingAndSlots = slotsMap.get.bind(slotsMap) as <D = object>(
  obj: any,
) => BrandingAndSlots<D> | undefined
export const setBrandingAndSlots = slotsMap.set.bind(slotsMap) as <D>(
  obj: any,
  brandingAndSlots: BrandingAndSlots<D>,
) => void

type SlotGetter<D> = (slots: D) => unknown
type SlotGetterMap<D, G extends object> = {
  [K in keyof G]: SlotGetter<D>
}
type GetterProps<G extends object> = {
  readonly [K in keyof G]: G[K] extends (...args: any[]) => infer R ? R : never
}

type MethodProps<M extends object> = {
  [K in keyof M]: M[K] extends (this: any, slots: any, ...args: infer A) => any
    ? (...args: A) => any
    : never
}

type ExtraMethods = {
  toString(options?: any): string
  toJSON(): string
  valueOf(): never
}

type SlotInstance<G extends object, M extends object> = GetterProps<G> &
  MethodProps<M> &
  Omit<ExtraMethods, keyof M>

type StaticMethods = Record<string, unknown>

type SlotClass<I, CA extends any[], SM extends StaticMethods> = {
  new (...args: CA): I
} & SM

export function createSlotClass<
  D,
  CA extends any[],
  G extends SlotGetterMap<D, G>,
  M extends object,
  SM extends StaticMethods,
  I extends SlotInstance<G, M> = SlotInstance<G, M>,
>(
  branding: string,
  construct: (...args: CA) => D,
  formatFunc: (slots: D, options?: any) => string,
  getters: G,
  methods: M,
  staticMethods: SM,
): [SlotClass<I, CA, SM>, (slots: D) => I, (obj: unknown) => D] {
  function Class(this: any, ...args: CA) {
    if (this instanceof Class) {
      const slots = construct(...args)
      setBrandingAndSlots(this, [branding, slots])
      dbg(this, slots, formatFunc)
    } else {
      throw new TypeError(errorMessages.invalidCallingContext)
    }
  }

  Object.defineProperties(Class.prototype, {
    ...createGetterDescriptors(mapProps(bindMethod, getters)),
    ...createPropDescriptors(
      mapProps(bindMethod, {
        ...methods,
        toString: formatFunc,
        toJSON: (slots: any) => formatFunc(slots), // should not forward args
        valueOf: neverValueOf,
      }),
    ),
    ...createStringTagDescriptors('Temporal.' + branding),
  })

  Object.defineProperties(Class, {
    ...createPropDescriptors(staticMethods),
    ...createNameDescriptors(branding),
  })

  function bindMethod(method: any, methodName: PropertyKey) {
    return Object.defineProperties(
      function (this: any, ...args: any[]) {
        return method.call(this, getSpecificSlots(this), ...args)
      },
      createNameDescriptors(String(methodName)),
    )
  }

  function getSpecificSlots(obj: any): D {
    const brandingAndSlots = getBrandingAndSlots<D>(obj)
    if (!brandingAndSlots || brandingAndSlots[0] !== branding) {
      throw new TypeError(errorMessages.invalidCallingContext)
    }
    return brandingAndSlots[1]
  }

  function createViaSlots(slots: D): I {
    const instance = Object.create(Class.prototype)
    setBrandingAndSlots(instance, [branding, slots])
    dbg(instance, slots, formatFunc)
    return instance
  }

  return [
    Class as unknown as SlotClass<I, CA, SM>,
    createViaSlots,
    getSpecificSlots,
  ]
}

// Utils
// -----------------------------------------------------------------------------

// TODO: best place for this?
export function rejectInvalidBag<B>(bag: B): B {
  if (
    getBrandingAndSlots(bag) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store internal calendar/time-zone objects, but public bags still
    // use the spec property names.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}

// Attaches debugging to the given instance
// Intentionally short function name for minification
function dbg(instance: any, slots: any, formatSlots: (slots: any) => string) {
  // NOT minified?
  // TODO: do this once at top-level?
  if (dbg.name === 'dbg') {
    Object.defineProperty(instance, '_str_', {
      value: formatSlots(slots),
    })
  }
}

function neverValueOf() {
  throw new TypeError(errorMessages.forbiddenValueOf)
}
