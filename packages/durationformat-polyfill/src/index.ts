import { Temporal } from 'temporal-spec'

// Unfortunately neccesary as typescript does not include typings for ecma drafts
// TODO: Remove when ListFormat becomes part of the official spec
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    interface ListFormatOptions {
      localeMatcher?: 'best fit' | 'lookup'
      type?: 'conjunction' | 'disjunction' | 'unit'
      style?: 'long' | 'short' | 'narrow'
    }

    interface ListFormatPart<T = string> {
      type: 'literal' | 'element'
      value: T
    }

    class ListFormat {
      constructor(locales?: string | string[], options?: Intl.ListFormatOptions)
      public formatToParts: (elements: string[]) => Intl.ListFormatPart[]
      public format: (items: [string?]) => string
    }
  }
}

function largestCommonString(a: string, b: string): string {
  const [short, long] = a.length < b.length ? [a, b] : [b, a]

  // Iterates from full short string by removing last character each iteration
  for (let i = short.length; i >= 0; i--) {
    const sub = short.substring(0, i)

    // If condition holds, its isn't possible for there to be a larger string in the loop
    if (long.includes(sub)) {
      return sub
    }
  }

  return ''
}

type DurationFormatOptions = { style: 'long' | 'short' | 'narrow' }

const durationFields: (keyof Temporal.DurationLike)[] = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
]

function getLiteralPartsValue(
  partsArr: Intl.RelativeTimeFormatPart[],
  index: number,
): string {
  return partsArr[index].type === 'literal' ? partsArr[index].value : ''
}

// Combines adjacent literal parts and removes blank literal parts
function collapseLiteralParts(
  parts: Intl.RelativeTimeFormatPart[],
): Intl.RelativeTimeFormatPart[] {
  const finalParts: Intl.RelativeTimeFormatPart[] = []

  // As we iterate the parts, will be a reference to the previous part, only if it was a literal.
  let prevLiteralPart: Intl.RelativeTimeFormatPart | undefined

  for (const part of parts) {
    if (part.type === 'literal') {
      // Don't consider literals that are blank
      if (part.value) {
        if (prevLiteralPart) {
          prevLiteralPart.value += part.value
        } else {
          prevLiteralPart = { ...part } // Copy in case we concat the value later (necessary?)
          finalParts.push(prevLiteralPart)
        }
      }
    } else {
      prevLiteralPart = undefined
      finalParts.push(part)
    }
  }

  return finalParts
}

function combinePartsArrays(
  durationPartArrays: Intl.RelativeTimeFormatPart[][],
  listFormatter: Intl.ListFormat,
): Intl.RelativeTimeFormatPart[] {
  // Produce an array of strings like ['0', '1', '2']
  const indexStrings = durationPartArrays.map((_part, index) => {
    return String(index)
  })
  const listParts = listFormatter.formatToParts(indexStrings)
  const combinedParts: Intl.RelativeTimeFormatPart[] = []

  for (const listPart of listParts) {
    if (listPart.type === 'element') {
      // When an element is encountered (a string like '1'),
      // inject parts from corresponding duration
      combinedParts.push(...durationPartArrays[parseInt(listPart.value)])
    } else {
      // Otherwise, inject a literal
      combinedParts.push(listPart)
    }
  }

  return collapseLiteralParts(combinedParts)
}

export class DurationFormat {
  private timeFormatter: Intl.RelativeTimeFormat
  private listFormatter: Intl.ListFormat

  constructor(
    readonly locale: string = 'en-us',
    { style }: DurationFormatOptions = { style: 'long' },
  ) {
    this.timeFormatter = new Intl.RelativeTimeFormat(locale, {
      numeric: 'always',
      style,
    })

    this.listFormatter = new Intl.ListFormat(locale, {
      style,
      type: style !== 'long' ? 'unit' : 'conjunction',
    })
  }

  formatToParts(
    durationLike: Temporal.Duration | Temporal.DurationLike,
  ): Intl.RelativeTimeFormatPart[] {
    const duration =
      durationLike instanceof Temporal.Duration
        ? durationLike
        : Temporal.Duration.from(durationLike)

    // Storage array
    const durationPartArrays: Intl.RelativeTimeFormatPart[][] = []

    for (const key of durationFields) {
      const val = duration[key]

      if (val !== 0 && key !== 'milliseconds') {
        const forwardParts = this.timeFormatter.formatToParts(
          val,
          key as Intl.RelativeTimeFormatUnit,
        )
        const backwardParts = this.timeFormatter.formatToParts(
          -val,
          key as Intl.RelativeTimeFormatUnit,
        )

        // Extract largest common string from formatted parts
        const before = largestCommonString(
          getLiteralPartsValue(forwardParts, 0),
          getLiteralPartsValue(backwardParts, 0),
        )
        const after = largestCommonString(
          getLiteralPartsValue(forwardParts, forwardParts.length - 1),
          getLiteralPartsValue(backwardParts, backwardParts.length - 1),
        )

        durationPartArrays.push([
          // Append pretext into accumulator
          {
            type: 'literal',
            value: before,
          },
          // Append actual value into accumulator
          forwardParts[forwardParts[0].type === 'literal' ? 1 : 0],
          // Append posttext into accumulator
          { type: 'literal', value: after },
        ])
      }
    }

    // Flatten 2D array into 1D
    return combinePartsArrays(durationPartArrays, this.listFormatter)
  }

  format(durationLike: Temporal.Duration | Temporal.DurationLike): string {
    const parts = this.formatToParts(durationLike)
    return parts
      .map((val) => {
        return val.value
      })
      .join('')
  }
}
