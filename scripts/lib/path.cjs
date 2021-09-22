
module.exports = {
  removeExt,
}

// NOTE: keep this updated with common extensions we use
function removeExt(filename) {
  return filename.replace(/\.(jsx?|cjs|mjs|json|tsx?|d\.ts)(\.map)?$/, '')
}
