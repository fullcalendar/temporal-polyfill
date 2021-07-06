import { Duration } from 'temporal-ponyfill'
import { DurationLike } from 'temporal-ponyfill/dist/duration'
import { LocaleId } from 'temporal-ponyfill/dist/utils'

const largestCommonString = (a: string, b: string): string => {
  // FIXME: There has to be a better way
  let largest = ''

  for (let i = 0; i <= a.length; i++) {
    const aSub = a.substring(0, i)
    const bSub = b.substring(0, i)

    if (aSub === bSub && aSub.length > largest.length) {
      largest = aSub
    }

    const aBackSub = a.substring(a.length - 1 - i, a.length)
    const bBackSub = b.substring(b.length - 1 - i, b.length)

    if (aBackSub === bBackSub && aBackSub.length > largest.length) {
      largest = aBackSub
    }
  }

  return largest
}

type DurationFormatOptions = { style: 'long' | 'short' | 'narrow' }

export class DurationFormat {
  private formatter: Intl.RelativeTimeFormat

  constructor(
    readonly locale: LocaleId = 'en-us',
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

    return Object.keys(duration).reduce(
      (
        accum: Array<Intl.RelativeTimeFormatPart>,
        key: Intl.RelativeTimeFormatUnit
      ) => {
        const val = duration[key]

        if (val !== 0) {
          const forwardUnit = this.formatter.formatToParts(val, key)
          const backwardUnit = this.formatter.formatToParts(-val, key)

          // Extract common string from formatted parts
          const before = largestCommonString(
            getLiteralValue(forwardUnit, 0),
            getLiteralValue(backwardUnit, 0)
          )
          const after = largestCommonString(
            getLiteralValue(forwardUnit, forwardUnit.length - 1),
            getLiteralValue(backwardUnit, backwardUnit.length - 1)
          )

          // Append pretext into accumulator
          if (before !== '' || accum.length > 0) {
            accum.push({
              type: 'literal',
              value: accum.length > 0 ? ' ' : '' + before,
            })
          }

          // Account for before part not being present
          accum.push(forwardUnit[forwardUnit[0].type === 'literal' ? 1 : 0])

          // Append posttext into accumulator
          if (after !== '') {
            accum.push({ type: 'literal', value: after })
          }
        }
        return accum
      },
      []
    )
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
