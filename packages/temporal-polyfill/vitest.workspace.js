import { defineWorkspace } from 'vitest/config'

const hasNativeTemporal = Boolean(globalThis.Temporal)
const funcApiForceShimValues = getFuncApiForceShimValues()

export default defineWorkspace([
  {
    test: {
      name: 'non-funcApi',
      include: ['src/**/*.test.ts'],
      exclude: ['src/funcApi/**/*.test.ts'],
    },
  },
  ...funcApiForceShimValues.map(createFuncApiProject),
])

function createFuncApiProject(forceShim) {
  return {
    define: {
      __FORCE_SHIM_IMPLEMENTATION__: forceShim,
    },
    test: {
      name: forceShim ? 'funcApi-force-shim' : 'funcApi-native',
      include: ['src/funcApi/*.test.ts'],
    },
  }
}

function getFuncApiForceShimValues() {
  if (hasNativeTemporal) {
    return [true, false]
  }

  console.log(
    'Skipping funcApi-native vitest project because globalThis.Temporal is unavailable.',
  )
  return [true]
}
