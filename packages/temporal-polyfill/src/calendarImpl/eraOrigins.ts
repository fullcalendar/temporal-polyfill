
// for converting from [era,eraYear] -> year
// if origin is positive,
//   year = origin + eraYear
// if origin is negative, consider the era to be 'reverse' direction
//   year = -origin - eraYear
//   year = -(origin + eraYear)
export const eraOrigins: {
  [calendarID: string]: { [era: string]: number }
} = {
  gregory: {
    bce: -1,
    ce: 0,
  },
  ethioaa: {
    era0: 0,
  },
  ethiopic: {
    era0: 0,
    era1: 5500,
  },
  coptic: {
    era0: -1,
    era1: 0,
  },
  roc: {
    'before-roc': -1,
    minguo: 0,
  },
  buddhist: {
    be: 0,
  },
  japanese: {
    bce: -1,
    ce: 0,
    meiji: 1867,
    taisho: 1911,
    show: 1925,
    heisei: 1988,
    reiwa: 2018,
  },
}
