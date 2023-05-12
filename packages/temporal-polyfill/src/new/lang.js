
export function identityFunc(thing) {
  return thing
}

export function noop() {
}

export function positiveModulo(n, max) {
  return (n % max + max) % max
}
