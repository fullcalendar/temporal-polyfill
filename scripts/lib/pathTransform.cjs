const { removeExt } = require('./path.cjs')

/*
Plugin, for esbuild
While generating production .cjs files, cjs files that import other local cjs must use
an explicit extension to avoid confusion with the .js files
Same for .mjs
*/

const cjsPathTransform = {
  name: 'cjs-path-transform',
  setup(build) {
    // match relative imports like './something'
    build.onResolve({ filter: /\.\/(.*)$/ }, (args) => {
      if (args.kind !== 'entry-point') {
        return { path: removeExt(args.path) + '.cjs', external: true }
      }
    })
  },
}

const mjsPathTransform = {
  name: 'mjs-path-transform',
  setup(build) {
    // match relative imports like './something'
    build.onResolve({ filter: /\.\/(.*)$/ }, (args) => {
      if (args.kind !== 'entry-point') {
        return { path: removeExt(args.path) + '.js', external: true }
      }
    })
  },
}

module.exports = {
  cjsPathTransform,
  mjsPathTransform,
}
