import * as fs from 'fs/promises'
import resolve from '@rollup/plugin-node-resolve'
import sucrase from '@rollup/plugin-sucrase'

// run:
// yarn rollup -c scripts/config/awesome.js
//
// clean:
// rm -rf packages/temporal-polyfill/dist

export default [
  {
    input: [
      'packages/temporal-polyfill/src/index.ts',
      'packages/temporal-polyfill/src/impl.ts',
      'packages/temporal-polyfill/src/global.ts',
      'packages/temporal-polyfill/src/shim.ts',
    ],
    external: [
      'temporal-spec',
    ],
    output: [
      {
        format: 'es',
        dir: 'packages/temporal-polyfill/dist',
        entryFileNames: '[name].js',
        chunkFileNames: 'common-[hash].js',
        plugins: [
          {
            generateBundle(options, bundle) {
              delete bundle['global.js']
            },
          },
        ],
      },
      {
        format: 'cjs',
        dir: 'packages/temporal-polyfill/dist',
        entryFileNames: '[name].cjs',
        chunkFileNames: 'common-[hash].cjs',
      },
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.ts'],
      }),
      sucrase({
        exclude: ['node_modules/**'],
        transforms: ['typescript'],
      }),
      {
        load: async(id) => {
          const match = id.match(/^(.*)\.ts$/)
          if (match) {
            const altPath = match[1] + '.build.ts'
            try {
              return await fs.readFile(altPath, 'utf8')
            } catch (err) {}
          }
          return null
        },
      },
    ],
  },
  {
    input: 'packages/temporal-polyfill/src/global.ts',
    external: [
      'temporal-spec',
    ],
    output: [
      {
        format: 'iife',
        file: 'packages/temporal-polyfill/dist/global.js',
      },
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.ts'],
      }),
      sucrase({
        exclude: ['node_modules/**'],
        transforms: ['typescript'],
      }),
      {
        load: async(id) => {
          const match = id.match(/^(.*)\.ts$/)
          if (match) {
            const altPath = match[1] + '.build.ts'
            try {
              return await fs.readFile(altPath, 'utf8')
            } catch (err) {}
          }
          return null
        },
      },
    ],
  },
]
