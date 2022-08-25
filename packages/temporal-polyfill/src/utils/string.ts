
export function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/*
converts a positive integer to a string with a guaranteed length, padding zeros on the left side
*/
export function padZeros(num: number, length: number): string {
  return padStart(String(num), length, '0')
}

export function padStart(str: string, len: number, padChar: string): string {
  return buildPadding(str, len, padChar) + str
}

export function padEnd(str: string, len: number, padChar: string): string {
  return str + buildPadding(str, len, padChar)
}

function buildPadding(str: string, len: number, padChar: string): string {
  return new Array(Math.max(0, len - str.length + 1)).join(padChar)
}

export function getSignStr(num: number): string {
  return num < 0 ? '-' : '+'
}
