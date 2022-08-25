const path = require('path')
const fs = require('fs/promises')

module.exports = {
  typePreparing,
  cleanTypeScriptCache,
  cleanRootTypesHack,
  createTypeInputHash,
}

// a Rollup plugin
function typePreparing(pkgDir) {
  return {
    // before writing .d.ts files
    generateBundle: async(options, bundle) => {
      const rootPaths = Object.keys(bundle)

      return Promise.all([
        cleanDistTypes(pkgDir),
        cleanRootTypesHack(pkgDir).then(() => {
          writeRootTypesHack(pkgDir, rootPaths)
        }),
      ])
    },
  }
}

async function cleanDistTypes(pkgDir) {
  await cleanTypeScriptCache(pkgDir) // invalid now that we're deleting .d.ts files

  const distDir = path.join(pkgDir, 'dist')
  const filenames = await fs.readdir(distDir)

  for (const filename of filenames) {
    const filePath = path.join(distDir, filename)
    const stat = await fs.lstat(filePath)

    if (
      stat.isDirectory() ||
      filename.match(/\.d\.ts$/) ||
      filename.match(/\.d\.ts\.map$/)
    ) {
      await fs.rm(filePath, { recursive: true, force: true })
    }
  }
}

async function cleanTypeScriptCache(pkgDir) {
  await fs.rm(
    path.join(pkgDir, 'tsconfig.tsbuildinfo'),
    { recursive: true, force: true },
  )
}

/*
HACK to overcome export maps not working in TypeScript
https://github.com/microsoft/TypeScript/issues/33079
Writes .d.ts files in root of package, referencing ./dist/*
*/
async function writeRootTypesHack(pkgDir, rootPaths) {
  for (const rootPath of rootPaths) {
    const moduleName = rootPath.replace(/\.d\.ts$/, '')
    if (moduleName !== 'index') { // no need. always specified in package.json "types"
      await fs.writeFile(
        path.join(pkgDir, rootPath),
        `export * from './dist/${moduleName}'\n`, // does not support default exports
      )
    }
  }
}

async function cleanRootTypesHack(pkgDir) {
  const filenames = await fs.readdir(pkgDir)

  for (const filename of filenames) {
    const filePath = path.join(pkgDir, filename)

    if (filename.match(/\.d\.ts$/)) {
      await fs.rm(filePath, { recursive: true, force: true })
    }
  }
}

/*
Rollup gets confused with deriving module names from filename extensions for .d.ts.
Make a hash the explicitly names modules
*/
function createTypeInputHash(inputArray) {
  return inputArray.reduce((accum, inputPath) => {
    const moduleName = path.basename(inputPath).replace(/\.d\.ts$/, '')
    accum[moduleName] = inputPath
    return accum
  }, {})
}
