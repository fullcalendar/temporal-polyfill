#!/usr/bin/env bash
# execute this script in a package's directory

# always immediately exit upon error
set -e

yarn run concurrently \
  "types:watch:pkg" \
  "js:watch:pkg"
