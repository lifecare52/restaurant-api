const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: ['**/*.js', 'node_modules', 'dist', 'coverage'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'prettier/prettier': 'error',
      'prettier/prettier': [
        'error',
        {
          "tabWidth": 2,  // Adjust tab width as needed
          "useTabs": false,  // Use spaces instead of tabs
          "endOfLine": "auto",  // Adjust line endings based on the system
          "trailingComma": "none",  // Avoid trailing commas
          "bracketSpacing": true,  // Adjust spacing between brackets
          "semi": true,  // Ensure semicolons are used at the end of statements
          "singleQuote": true  // Use single quotes instead of double quotes
        }
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            { pattern: '@modules/**', group: 'internal', position: 'after' },
            { pattern: '@shared/**', group: 'internal', position: 'after' },
            { pattern: '@middlewares/**', group: 'internal', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      'import/no-cycle': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Avoid parent-relative imports. Use path aliases (@modules, @shared, @middlewares) or baseUrl imports.',
            },
          ],
        },
      ],
    },
  },
];
