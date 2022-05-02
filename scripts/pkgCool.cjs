const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

esbuild.build({
  entryPoints: [
    'packages/temporal-polyfill/src/index.ts',
    'packages/temporal-polyfill/src/impl.ts',
    'packages/temporal-polyfill/src/global.ts',
    'packages/temporal-polyfill/src/shim.ts',
  ],
  splitting: true,
  bundle: true,
  format: 'esm',
  external: [
    'temporal-spec', // TODO: use package.json
  ],
  outdir: 'packages/temporal-polyfill/dist',
  // TODO: control output name, remove .build.ts
  plugins: [
    {
      name: 'use .build.ts extension',
      setup(build) {
        // match relative imports like './something'
        build.onResolve({ filter: /\.\/(.*)$/ }, (args) => {
          const newPath = path.join(
            args.resolveDir,
            args.path.replace(/\.ts$/, '') + '.build.ts',
          )
          if (fs.existsSync(newPath)) { // TODO: async!!!
            return { path: newPath, external: false }
          }
        })
      },
    },
  ],
})
