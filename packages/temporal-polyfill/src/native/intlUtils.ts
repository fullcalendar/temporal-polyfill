import { Intl as IntlSpec } from 'temporal-spec'
import { isObjectLike } from '../argParse/refine'

export type LocalesArg = string | string[]

// TODO: unify this as a class/const, to just export DateTimeFormat,
// and have whole src reference it only, not Intl.DateTimeFormat
export const OrigDateTimeFormat = Intl.DateTimeFormat

export function normalizeAndCopyLocalesArg(localesArg: LocalesArg | undefined): string[] {
  return ([] as string[]).concat(localesArg || [])
}

// TODO: more efficient way to do this, mapping resolvedOptions
export function flattenOptions(
  options: IntlSpec.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  const newOptions: Intl.DateTimeFormatOptions = {}

  for (const name in options) {
    let val = (options as any)[name]

    if (isObjectLike(val)) {
      val = val.toString()
    }

    (newOptions as any)[name] = val
  }

  return newOptions
}
