#!/usr/bin/env bash
# execute this script in a package's directory

# always immediately exit upon error
set -e

yarn run rollup -c `dirname $0`/../rollup.config.js

echo 'Removing extra declarations...' && rm -f dist/?(!(index)).d.ts || true
