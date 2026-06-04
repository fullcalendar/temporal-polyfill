#!/usr/bin/env node

import {
  basename,
  dirname,
  join as joinPaths,
  relative as relativePath,
  resolve as resolvePath,
  sep as pathSep,
} from 'path'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { readFile } from 'fs/promises'
import { rollup as rollupBuild, watch as rollupWatch } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { extensions } from './lib/config.js'
import { pureTopLevel } from './lib/pure-top-level.js'
import { buildTerserOptions } from './lib/terser-options.js'
import { terserSimple } from './lib/terser-simple.js'

const argv = process.argv.slice(2)

writeBundles(joinPaths(process.argv[1], '../..'), argv.includes('--dev'))

async function writeBundles(pkgDir, isDev) {
  const configs = await buildConfigs(pkgDir, isDev)
  await (isDev ? watchWithConfigs : buildWithConfigs)(configs)
}

async function buildConfigs(pkgDir, isDev) {
  const pkgJsonPath = joinPaths(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await readFile(pkgJsonPath))
  const isExternalDependency = buildExternalDependencyResolver(pkgJson)
  const isIifeExternalDependency = buildExternalDependencyResolver(pkgJson, {
    bundleDependencies: true,
  })
  const exportMap = pkgJson.buildConfig.exports
  const moduleInputs = {}
  const iifeConfigs = []
  const dtsInputs = {}
  const dtsConfigs = []
  const chunkNamesEnabled = true // isDev
  const chunkBase = 'chunks/' + (chunkNamesEnabled ? '[name]' : '[hash]')
  const sourceDirectoryChunksPlugin = buildSourceDirectoryChunksPlugin(
    resolvePath(pkgDir, 'dist/.tsc'),
  )

  for (const exportPath in exportMap) {
    const exportConfig = exportMap[exportPath]
    const exportName =
      exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '')

    // TODO: rename to 'transpiled' path?
    const srcPath = joinPaths(
      pkgDir,
      'dist/.tsc',
      (exportConfig.src || exportName) + '.js',
    )
    const dtsPath = joinPaths(
      pkgDir,
      'dist/.tsc',
      (exportConfig.types || exportConfig.src || exportName) + extensions.dts,
    )

    moduleInputs[exportName] = srcPath
    dtsInputs[exportName] = dtsPath

    if (exportConfig.iife) {
      iifeConfigs.push({
        input: srcPath,
        onwarn,
        external: isIifeExternalDependency,
        plugins: [
          nodeResolve(),
          // for reading sourcemaps from tsc
          isDev && sourcemaps(),
        ],
        output: {
          format: 'iife',
          file: joinPaths('dist', exportName + extensions.iife),
          sourcemap: isDev,
          sourcemapExcludeSources: true,
          plugins: [
            !isDev &&
              buildTerserPlugin({
                humanReadable: true,
              }),
          ],
        },
      })
    }
  }

  if (!isDev && Object.keys(dtsInputs).length) {
    dtsConfigs.push({
      input: dtsInputs,
      onwarn,
      external: isExternalDependency,
      plugins: [
        // Will not bundle external packages by default
        dts(),

        {
          // WORKAROUND: dts plugin was including empty import statements,
          // despite attempting hoistTransitiveImports:false. Especially bad
          // because temporal-spec/global was being imported from index.
          renderChunk(code) {
            return code.replace(/^import ['"][^'"]*['"](;|$)/gm, '')
          },
        },
        sourceDirectoryChunksPlugin,
      ],
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name]' + extensions.dts,
        chunkFileNames: chunkBase + extensions.dts,
        minifyInternalExports: false,
      },
    })
  }

  return [
    {
      input: moduleInputs,
      onwarn,
      external: isExternalDependency,
      plugins: [sourceDirectoryChunksPlugin],
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames(chunkInfo) {
          const exportName = chunkInfo.name
          const exportPath = exportName === 'index' ? '.' : './' + exportName

          const esmExtension =
            (exportMap[exportPath].iife ? extensions.esmWhenIifePrefix : '') +
            extensions.esm

          return exportName + esmExtension
        },
        chunkFileNames: chunkBase + extensions.esm,
        minifyInternalExports: false,
        hoistTransitiveImports: false,
        // If you're tempted to write sourcemaps to ESM, don't!
        // They don't play well with vitest it seems. Not accurate.
        //// sourcemap: isDev,
        //// sourcemapExcludeSources: true,
        plugins: [
          !isDev && pureTopLevel(),
          !isDev &&
            buildTerserPlugin({
              humanReadable: true,

              //// NOTE: temporarily disable while we figure out tree-shaking problems
              // mangleProps: true,
              // manglePropsExcept: temporalReservedWords,

              preserveAnnotations: true,
            }),
        ],
      },
    },
    ...iifeConfigs,
    ...dtsConfigs,
  ]
}

function buildWithConfigs(configs) {
  return Promise.all(
    configs.map(async (config) => {
      const bundle = await rollupBuild(config)

      return Promise.all(
        arrayify(config.output).map((outputConfig) => {
          if (outputConfig) {
            return bundle.write(outputConfig)
          }
        }),
      )
    }),
  )
}

async function watchWithConfigs(configs) {
  const rollupWatcher = rollupWatch(configs)

  return new Promise((resolve) => {
    rollupWatcher.on('event', (ev) => {
      switch (ev.code) {
        case 'ERROR':
          console.error(ev.error)
          break
        case 'BUNDLE_END':
          console.log(formatWriteMessage(ev.input))
          ev.result.close() // our responsibility to call this
          break
        case 'END':
          resolve()
          break
      }
    })
  })
}

function formatWriteMessage(input) {
  const inputPaths = typeof input === 'object' ? Object.values(input) : [input]
  const inputNames = inputPaths.map((inputPath) => basename(inputPath))

  return `Bundled ${inputNames.join(', ')}`
}

function onwarn(warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    console.error(warning.toString())
  }
}

function buildExternalDependencyResolver(pkgJson, options = {}) {
  const dependencyNames = options.bundleDependencies
    ? []
    : Object.keys(pkgJson.dependencies || {})

  return (id) => {
    // Bare package imports in dependencies are runtime dependencies unless this
    // bundle opts into inlining them. Dev dependencies are build-time inputs and
    // are always left for Rollup to resolve and bundle if imported.
    return dependencyNames.some((dependencyName) => {
      return id === dependencyName || id.startsWith(dependencyName + '/')
    })
  }
}

// Terser
// -----------------------------------------------------------------------------

function buildTerserPlugin({
  humanReadable = false,
  mangleProps = false,
  preserveAnnotations = false,
  manglePropsExcept,
}) {
  return terserSimple(
    buildTerserOptions({
      humanReadable,
      mangleProps,
      preserveAnnotations,
      manglePropsExcept,
    }),
  )
}

// Rollup Utils
// -----------------------------------------------------------------------------

function buildSourceDirectoryChunksPlugin(sourceRoot) {
  return {
    name: 'source-directory-chunks',
    outputOptions(outputOptions) {
      const originalManualChunks = outputOptions.manualChunks

      return {
        ...outputOptions,
        manualChunks(id, meta) {
          const chunkName = resolveSourceDirectoryChunkName(
            id,
            sourceRoot,
            meta,
          )

          if (chunkName) {
            return chunkName
          }

          if (typeof originalManualChunks === 'function') {
            return originalManualChunks(id, meta)
          }
        },
      }
    },
  }
}

// Match the Rollup chunk name to the source file's directory under `dist/.tsc`.
// Top-level files go to `root`; nested paths are flattened so
// `funcApi/native/foo.js` becomes the `funcApi-native` chunk instead of writing
// into a nested `chunks/funcApi/native.*` output path.
function resolveSourceDirectoryChunkName(id, sourceRoot, meta) {
  // Keep entry modules as facades so side-effectful entries like global.ts
  // cannot become reusable chunks for shim.ts or implementation.ts.
  if (meta.getModuleInfo(id)?.isEntry) {
    return
  }

  const sourceRootWithSep = sourceRoot + pathSep

  if (!id.startsWith(sourceRootWithSep)) {
    return
  }

  const sourceDir = dirname(relativePath(sourceRoot, id))

  return sourceDir === '.' ? 'root' : sourceDir.split(pathSep).join('-')
}

// Lang Utils
// -----------------------------------------------------------------------------

function arrayify(input) {
  return Array.isArray(input) ? input : input == null ? [] : [input]
}
