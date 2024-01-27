#!/usr/bin/env node

// TODO: clean export-size-output

import fs from 'fs/promises'
import path from 'path'

const shouldDeleteTsc = process.argv.slice(2).includes('--tsc')

async function clean() {
  const files = await fs.readdir('./dist')

  for (const file of files) {
    const filePath = path.join('./dist', file)

    if (
      file !== '.npmignore' &&
      (shouldDeleteTsc || (
        file !== '.tsc' &&
        file !== 'tsconfig.tsbuildinfo'
      ))
    ) {
      await fs.rm(filePath, { recursive: true })
    }
  }

  await fs.rm('./export-size-output', { recursive: true, force: true })
}

clean()
