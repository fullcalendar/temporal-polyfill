const path = require('path')
const fs = require('fs/promises')
const { analyzePkgConfig2, getPkgConfigAtRoot } = require('../lib/pkgAnalyze.cjs')
const resolve = require('@rollup/plugin-node-resolve').default
const sucrase = require('@rollup/plugin-sucrase')
const { terser } = require('rollup-plugin-terser')
const dts = require('rollup-plugin-dts').default

module.exports = (commandLineArgs) => {
  const { watch } = commandLineArgs
  const pkgInfo = analyzePkgConfig2(getPkgConfigAtRoot())
  const { entryPoints, entryPointTypes, globalEntryPoint, dependencyNames } = pkgInfo

  if (!entryPoints.length) {
    return []
  }

  return [
    {
      input: entryPoints,
      external: dependencyNames,
      output: [
        buildOutputConfig('es', '.mjs'),
        buildOutputConfig('cjs', '.cjs'),
      ],
      plugins: buildPlugins(watch),
    },
    globalEntryPoint && {
      input: globalEntryPoint,
      external: dependencyNames,
      output: buildGlobalOutputConfig(),
      plugins: buildPlugins(watch),
    },
    !watch && {
      input: entryPointTypes,
      external: dependencyNames,
      output: { // use buildOutputConfig?
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name].d.ts',
        chunkFileNames: 'common-[hash].d.ts',
        // no source maps
        plugins: [
          {
            // before writing .d.ts files
            generateBundle: async(options, bundle) => {
              const rootPaths = Object.keys(bundle)
              return Promise.all([
                cleanDistTypes(),
                cleanRootTypes().then(writeRootTypes(rootPaths)),
              ])
            },
          },
        ],
      },
      plugins: [dts()],
    },
  ]
}

function buildOutputConfig(format, extension) {
  return {
    format,
    dir: 'dist',
    entryFileNames: '[name]' + extension,
    chunkFileNames: 'common-[hash]' + extension,
    sourcemap: true,
    sourcemapExcludeSources: true,
  }
}

function buildGlobalOutputConfig() {
  return {
    format: 'iife',
    dir: 'dist',
    // no code splitting
    sourcemap: true,
    sourcemapExcludeSources: true,
  }
}

function buildPlugins(watch) {
  return [
    resolve({
      extensions: ['.js', '.ts'],
    }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript'],
    }),
    tsFileOverriding('.build.ts'),
    !watch && terser(), // TODO: use terser.json config (import json)
  ]
}

async function tsFileOverriding(forcedExtension) {
  return {
    load: async(id) => {
      const match = id.match(/^(.*)\.ts$/)
      if (match) {
        const altPath = match[1] + forcedExtension
        try {
          return await fs.readFile(altPath, 'utf8')
        } catch (err) {}
      }
      return null
    },
  }
}

async function cleanDistTypes() {
  // tsbuild cache is invalid now
  await fs.rm('tsconfig.tsbuildinfo', { recursive: true, force: true })

  const distDir = path.join(process.cwd(), 'dist')
  const files = await fs.readdir(distDir)

  for (const file of files) {
    const filePath = path.join(distDir, file)
    const stat = await fs.lstat(filePath)
    if (
      stat.isDirectory() ||
      file.match(/\.d\.ts$/) ||
      file.match(/\.d\.ts\.map$/)
    ) {
      await fs.rm(filePath, { recursive: true, force: true })
    }
  }
}

async function cleanRootTypes() {
  const files = await fs.readdir(process.cwd())
  for (const file of files) {
    if (file.match(/\.d\.ts$/)) {
      await fs.rm(file, { recursive: true, force: true })
    }
  }
}

async function writeRootTypes(rootPaths) {
  for (const rootPath of rootPaths) {
    console.log('writing', rootPath)
    await fs.writeFile(
      rootPath,
      `export * from './dist/${rootPath}'\n`,
      // export default too ???
    )
  }
}
