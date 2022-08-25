
declare const window: any

// BAD because `any`
// TODO: make this variaible available as part of intro/outro that wraps everything
export function getGlobalThis(): any {
  return typeof globalThis !== 'undefined' ? globalThis : window
}
