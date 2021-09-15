#!/usr/bin/env bash

# always immediately exit upon error
set -e

yarn run types:build
yarn run types:bundle
yarn run js:build
yarn run js:minify
