module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['standard', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-void': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      {
        allowArgumentsExplicitlyTypedAsAny: true,
      },
    ],
    'spaced-comment': [
      'warn',
      'always',
      { exceptions: ['-', '+', '#__PURE__'] },
    ],
  },
}
