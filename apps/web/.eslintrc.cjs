module.exports = {
  extends: ['../../.eslintrc.cjs', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  plugins: ['react', 'react-hooks'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: '18.3' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
  },
  env: {
    browser: true,
    es2022: true,
  },
};
