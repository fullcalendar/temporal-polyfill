#!/usr/bin/env bash

# always immediately exit upon error
set -e

yarn run concurrently \
  "types:watch" \
  "js:watch"
