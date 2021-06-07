import { PlainDateTimeFields } from './types'

export const dateFormat = (
  {
    isoYear,
    isoMonth,
    isoDay,
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
  }: PlainDateTimeFields,
  offset = ''
): string => {
  const yearStr = `000${isoYear}`.slice(-4)
  const monthStr = `0${isoMonth}`.slice(-2)
  const dayStr = `0${isoDay}`.slice(-2)
  const hourStr = `0${isoHour}`.slice(-2)
  const minStr = `0${isoMinute}`.slice(-2)
  const secStr = `0${isoSecond}`.slice(-2)
  const msStr = `00${isoMillisecond}`.slice(-3)
  return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}.${msStr}${offset}`
}
