export const extensions = {
  esm: '.js',

  // will cause all buildConfig paths with iife:true to ALSO be outputted
  // as an ESM module that can be imported by another script
  esmWhenIifePrefix: '.esm',

  // .cjs extension (not .js) is required so that Node loads the IIFE bundle
  // as CommonJS even in a package with "type": "module". Without it, Node
  // would reject require('temporal-polyfill/global') with ERR_REQUIRE_ESM
  // because all .js files in a "type":"module" package are treated as ESM.
  iife: '.cjs',
  iifeMin: '.min.js',
  dts: '.d.ts',
}

export const minifyPathMap = {
  'dist/global.cjs': 'dist/.global.min.js',
  'dist/full/global.cjs': 'dist/full/.global.min.js',
}
