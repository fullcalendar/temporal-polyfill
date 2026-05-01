import { TimeFields } from './fieldTypes'
import { nanoToTimeAndDay } from './timeMath'
import { fractionRegExpStr, parseInt0, parseSubsecNano } from './utils'

export const timeRegExpStr =
  '(\\d{2})' + // 1:hour
  '(?::?(\\d{2})' + // 2:minute
  '(?::?(\\d{2})' + // 3:second
  fractionRegExpStr + // 4:afterDecimal
  ')?' +
  ')?'

export function organizeTimeParts(parts: string[]): TimeFields {
  const second = parseInt0(parts[3])

  return {
    ...nanoToTimeAndDay(parseSubsecNano(parts[4] || ''))[0],
    hour: parseInt0(parts[1]),
    minute: parseInt0(parts[2]),
    second: second === 60 ? 59 : second, // massage leap-second
  }
}
