import { Duration } from 'temporal-polyfill'

const largestCommonString = (a: string, b: string): string => {
  const [short, long] = a.length < b.length ? [a, b] : [b, a]
  return long.includes(short) ? short : ''
}

type DurationFormatOptions = { style: 'long' | 'short' | 'narrow' }

type DurationLike = Partial<Duration>

const combinePartsArrays = (
  arr: Array<Array<Intl.RelativeTimeFormatPart>>
): Array<Intl.RelativeTimeFormatPart> => {
  const newArr = []

  // Flatten 2D array into 1D
  arr.forEach((innerArr, index) => {
    const [before, value, after] = innerArr

    // Add a space before if this isn't the first element
    if (index > 0) {
      newArr.push({ ...before, value: ` ${before.value}` })
    }
    // Case for first element having content
    else if (before.value !== '') {
      newArr.push(before)
    }

    // Push actual value
    newArr.push(value)

    // Push after only if it has content
    if (after.value !== '') {
      newArr.push(after)
    }
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

    // I just don't want to write this statement 4 times
    const getLiteralValue = (
      arr: Array<Intl.RelativeTimeFormatPart>,
      index: number
    ): string => {
      return arr[index].type === 'literal' ? arr[index].value : ''
    }

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
          getLiteralValue(forwardParts, 0),
          getLiteralValue(backwardParts, 0)
        )
        const after = largestCommonString(
          getLiteralValue(forwardParts, forwardParts.length - 1),
          getLiteralValue(backwardParts, backwardParts.length - 1)
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

    return combinePartsArrays(arr)
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
