import { PlainDateTimeFields } from './plainDateTime'

export const padZeros = (num: number, length: number): string => {
  return `${num}`.padStart(length, '0')
}

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
  const yearStr = padZeros(isoYear, 4)
  const monthStr = padZeros(isoMonth, 2)
  const dayStr = padZeros(isoDay, 2)
  const hourStr = padZeros(isoHour, 2)
  const minStr = padZeros(isoMinute, 2)
  const secStr = padZeros(isoSecond, 2)
  const msStr = padZeros(isoMillisecond, 3)
  return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}.${msStr}${offset}`
}
