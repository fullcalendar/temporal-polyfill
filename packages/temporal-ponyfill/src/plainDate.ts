import { CompareReturn } from './utils'

export type PlainDate = {
  isoYear: number
  isoMonth: number
  isoDay: number
}

export const comparePlainDate = (
  one: PlainDate,
  two: PlainDate
): CompareReturn => {
  const diff =
    one.isoYear - two.isoYear ||
    one.isoMonth - two.isoMonth ||
    one.isoDay - two.isoDay

  if (diff < 0) {
    return -1
  } else if (diff > 0) {
    return 1
  }
  return 0
}
