import { Duration } from 'temporal-ponyfill'
import { DurationLike } from 'temporal-ponyfill/dist/duration'
import { LocaleId } from 'temporal-ponyfill/dist/utils'

const largestCommonString = (a: string, b: string): string => {
  return '' // TODO Implement this
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

  formatToParts(durationLike: Duration | DurationLike): Array<any> {
    const duration =
      durationLike instanceof Duration
        ? durationLike
        : Duration.from(durationLike)

    const getLiteralValue = (
      arr: Array<Intl.RelativeTimeFormatPart>,
      index: number
    ): string => {
      return arr[index].type === 'literal' ? arr[index].value : ''
    }

    return Object.keys(duration).reduce(
      (accum, key: Intl.RelativeTimeFormatUnit) => {
        const val = duration[key]

        if (val !== 0) {
          const forwardUnit = this.formatter.formatToParts(val, key)
          const backwardUnit = this.formatter.formatToParts(-val, key)

          const before = largestCommonString(
            getLiteralValue(forwardUnit, 0),
            getLiteralValue(backwardUnit, 0)
          )
          const after = largestCommonString(
            getLiteralValue(forwardUnit, forwardUnit.length - 1),
            getLiteralValue(backwardUnit, backwardUnit.length - 1)
          )
          return [
            ...accum,
            val,
            key.substring(0, key.length - 1),
            // { type: 'literal', value: before},
            // { type: 'integer', value: val, unit: key },
            // { type: 'literal', value: after },
          ]
        }
        return accum
      },
      []
    )
  }

  format(durationLike: Duration | DurationLike): string {
    const parts = this.formatToParts(durationLike)
    return parts.join(' ')
  }
}
