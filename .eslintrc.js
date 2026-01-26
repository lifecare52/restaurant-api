module.exports = {
  root: true,
  env: { node: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: ['**/*.js', 'node_modules', 'dist', 'coverage'],
  overrides: [
    {
      files: ['src/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        'no-console': 'warn',
        'prettier/prettier': 'error',
        'import/order': [
          'error',
          {
            'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
            'newlines-between': 'always',
            'alphabetize': { order: 'asc', caseInsensitive: true },
            'pathGroups': [
              { pattern: '@modules/**', group: 'internal', position: 'after' },
              { pattern: '@shared/**', group: 'internal', position: 'after' }
            ],
            'pathGroupsExcludedImportTypes': ['builtin']
          }
        ],
        'import/no-cycle': 'error',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              '@modules/*/*.model',
              '@modules/*/*.model.*',
              '@modules/*/**.model',
              '@modules/*/**.model.*'
            ],
            message: 'Cross-module model imports are forbidden. Use services/interfaces.',
          },
        ],
      },
    },
  ],
};
