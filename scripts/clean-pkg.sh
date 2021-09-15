#!/usr/bin/env bash
# execute this script in a package's directory

# always immediately exit upon error
set -e

rm -rf dist tsconfig.tsbuildinfo e2e/tsconfig.tsbuildinfo
