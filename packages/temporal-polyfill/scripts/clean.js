#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

const deleteTsc = process.argv.slice(2).includes('--all')

const dirPath = './dist'
const whitelist = [
  '.npmignore',
  ...(deleteTsc ? [] : [
    '.tsc',
    'tsconfig.tsbuildinfo'
  ])
]

async function clean() {
  const files = await fs.readdir(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)

    if (!whitelist.includes(file)) {
      await fs.rm(filePath, { recursive: true })
    }
  }
}

clean()
