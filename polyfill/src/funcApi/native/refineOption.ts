/*
Copies an options object for a native method, with one option refined, such as
a function-API record swapped for its native object, or a time zone ID checked.

The caller's object is read in a single pass, so each option is read exactly
once, and native only sees the copy's plain data. Unlike the class API, the
native branch doesn't keep the spec's order of option reads: the copy reads
every enumerable option up front, in key order, before native validates any of
them. That departure is deliberate. Reading an option twice is not allowed.

The copy loops with for...in rather than spreading, so options inherited through
a prototype still reach native. A missing or non-object value passes through
unchanged, so native accepts undefined and rejects null with a TypeError.
*/
export function refineOption<O extends object, K extends keyof O, V>(
  options: O | undefined,
  optionName: K,
  refine: (value: O[K]) => V,
): Omit<O, K> & { [P in K]: V } {
  if (Object(options) !== options) {
    return options as any
  }

  const copy: any = {}
  for (const key in options) {
    copy[key] = options[key]
  }
  copy[optionName] = refine(copy[optionName])
  return copy
}
