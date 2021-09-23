
// HACK to overcome export maps not working in TypeScript
// https://github.com/microsoft/TypeScript/issues/33079
// for e2e tests
export * from './dist/global'
