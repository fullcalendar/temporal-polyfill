import { Duration } from 'temporal-polyfill'

const largestCommonString = (a: string, b: string): string => {
  const [short, long] = a.length < b.length ? [a, b] : [b, a]
  return long.includes(short) ? short : ''
}

type DurationFormatOptions = { style: 'long' | 'short' | 'narrow' }

type DurationLike = Partial<Duration>

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
    const arr = []

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

        // Extract common string from formatted parts
        const before = largestCommonString(
          getLiteralValue(forwardParts, 0),
          getLiteralValue(backwardParts, 0)
        )
        const after = largestCommonString(
          getLiteralValue(forwardParts, forwardParts.length - 1),
          getLiteralValue(backwardParts, backwardParts.length - 1)
        )

        // Append pretext into accumulator
        if (before !== '' || arr.length > 0) {
          arr.push({
            type: 'literal',
            // Add a space if this isn't the first value
            value: `${arr.length > 0 ? ' ' : ''}${before}`,
          })
        }

        // Account for before part not being present
        arr.push(forwardParts[forwardParts[0].type === 'literal' ? 1 : 0])

        // Append posttext into accumulator
        if (after !== '') {
          arr.push({ type: 'literal', value: after })
        }
      }
    }

    return arr
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
