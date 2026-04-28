/**
 * ESLint overrides for the NestJS API.
 *
 * NestJS relies on `emitDecoratorMetadata` and reflection to wire constructor
 * injection. The `consistent-type-imports` rule cannot tell the difference
 * between a class used as a type annotation and a class used as an injection
 * token, so it auto-fixes injected services into `import type` declarations,
 * which TypeScript then erases at emit time and DI silently breaks.
 *
 * We disable that rule for this package. We still get the value of strict
 * import ordering and unused-import detection from the root config.
 */
module.exports = {
  extends: ['../../.eslintrc.cjs'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'off',
  },
};
