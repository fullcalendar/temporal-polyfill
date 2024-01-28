
export const extensions = {
  esm: '.esm.js',
  cjs: '.cjs',
  iife: '.js',
  iifeMin: '.min.js',
  dts: '.d.ts',
}

export const currentNodeVersion = process.versions.node
export const currentNodeMajorVersion = parseInt(currentNodeVersion.split('.')[0])

export const ciRunning = Boolean(process.env.CI)
export const ciConfig = {
  esm: Boolean(Math.floor(currentNodeMajorVersion / 4) % 2),
  min: Boolean(Math.floor(currentNodeMajorVersion / 2) % 2),
}
