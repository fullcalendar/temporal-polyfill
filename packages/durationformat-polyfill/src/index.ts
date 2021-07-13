import { Duration } from 'temporal-polyfill'

// TODO: This needs to be more fleshed out
const largestCommonString = (a: string, b: string): string => {
  const [short, long] = a.length < b.length ? [a, b] : [b, a]
  return long.includes(short) ? short : ''
}

type DurationFormatOptions = { style: 'long' | 'short' | 'narrow' }

type DurationLike = Partial<Duration>

const getLiteralPartsValue = (
  arr: Array<Intl.RelativeTimeFormatPart>,
  index: number
): string => {
  return arr[index].type === 'literal' ? arr[index].value : ''
}

const combinePartsArrays = (
  arr: Array<Array<Intl.RelativeTimeFormatPart>>
): Array<Intl.RelativeTimeFormatPart> => {
  let newArr = []

  // Flatten 2D array into 1D
  arr.forEach((innerArr, index) => {
    const [before, value, after] = innerArr

    newArr = [
      ...newArr,
      // Add a space before if this isn't the first element
      index > 0 ? { ...before, value: ` ${before.value}` } : before,
      value,
      after,
    ]
  })

  return newArr
}

export class DurationFormat {
  private formatter: Intl.RelativeTimeFormat

  constructor(
    readonly locale: string = 'en-us',
    { style }: DurationFormatOptions = { style: 'long' }
  ) {
    this.formatter = new Intl.RelativeTimeFormat(locale, {
      numeric: 'always',
      style,
    })
  }

  formatToParts(
    durationLike: Duration | DurationLike
  ): Array<Intl.RelativeTimeFormatPart> {
    const duration =
      durationLike instanceof Duration
        ? durationLike
        : Duration.from(durationLike)

    // Storage array
    const arr: Array<Array<Intl.RelativeTimeFormatPart>> = []

    for (const key in duration) {
      const val = duration[key]

      if (val !== 0) {
        const forwardParts = this.formatter.formatToParts(
          val,
          key as Intl.RelativeTimeFormatUnit
        )
        const backwardParts = this.formatter.formatToParts(
          -val,
          key as Intl.RelativeTimeFormatUnit
        )

        // Extract largest common string from formatted parts
        const before = largestCommonString(
          getLiteralPartsValue(forwardParts, 0),
          getLiteralPartsValue(backwardParts, 0)
        )
        const after = largestCommonString(
          getLiteralPartsValue(forwardParts, forwardParts.length - 1),
          getLiteralPartsValue(backwardParts, backwardParts.length - 1)
        )

        arr.push([
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
    const flatArr = combinePartsArrays(arr)

    // Remove empty items
    return flatArr.filter(({ type, value }) => {
      return type !== 'literal' || value !== ''
    })
  }

  format(durationLike: Duration | DurationLike): string {
    const parts = this.formatToParts(durationLike)
    return parts
      .map((val) => {
        return val.value
      })
      .join('')
  }
}
