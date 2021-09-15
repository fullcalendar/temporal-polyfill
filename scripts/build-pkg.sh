#!/usr/bin/env bash
# execute this script in a package's directory

# always immediately exit upon error
set -e

yarn run types:build:pkg
yarn run types:bundle:pkg
yarn run js:build:pkg
yarn run js:minify:pkg
