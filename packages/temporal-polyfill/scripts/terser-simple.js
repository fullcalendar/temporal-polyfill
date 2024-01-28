import { minify } from 'terser'

/*
Official @rollup/plugin-terser package has bug with nameCache and parallel workers
(even when maxWorkers=1). TODO: file a bug. Until it's fixed, use simplified plugin based on:
https://github.com/rollup/plugins/blob/master/packages/terser/src/module.ts
*/
export function terserSimple(options) {
  return {
    name: 'terser-simple',
    async renderChunk(code, chunk, outputOptions) {
      const defaultOptions = {
        sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === 'string'
      }
      if (outputOptions.format === 'es') {
        defaultOptions.module = true
      }
      if (outputOptions.format === 'cjs') {
        defaultOptions.toplevel = true
      }

      const mergedOptions = { ...defaultOptions, ...options }
      const { code: result, sourceMap } = await minify(code, mergedOptions)

      if (mergedOptions.sourceMap && typeof sourceMap === 'object') {
        return {
          code: result,
          map: sourceMap,
        }
      }

      return result
    }
  }
}
