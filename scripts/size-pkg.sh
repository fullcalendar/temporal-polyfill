#!/usr/bin/env bash
# execute this script in a package's directory

# always immediately exit upon error
set -e

gzip -c -r dist/index.js | wc -c | numfmt --to=iec-i --suffix=B
