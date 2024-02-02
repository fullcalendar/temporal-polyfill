import { expect } from 'vitest'

export function expectPropsEqualStrict(obj0: {}, obj1: {}): void {
  expect(obj0).toStrictEqual(obj1)
  expect(Object.keys(obj0)).toStrictEqual(Object.keys(obj1))
}
