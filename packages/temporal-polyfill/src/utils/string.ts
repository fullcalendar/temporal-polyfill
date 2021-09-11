
export function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function padZeros(num: number, length: number): string {
  return String(num).padStart(length, '0')
}
