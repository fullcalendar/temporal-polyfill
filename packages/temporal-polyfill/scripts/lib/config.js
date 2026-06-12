export const extensions = {
  esm: '.js',

  // will cause all buildConfig paths with iife:true to ALSO be outputted
  // as an ESM module that can be imported by another script
  esmWhenIifePrefix: '.esm',

  iife: '.js',
  iifeMin: '.min.js',
  dts: '.d.ts',
}

// TEMPORARY
export const minifyPathMap = {
  'dist/global.js': 'dist/global.js', // 'dist/.global.min.js',
  'dist/full/global.js': 'dist/full/global.js', // 'dist/full/.global.min.js',
}
