// For Jest. Individual packages extend this config
// TODO: when running test in "built-mode", don't do any babel transforming

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
}
