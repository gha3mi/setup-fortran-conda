import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['build/**', 'dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'consistent-return': 'error',
      curly: ['error', 'all'],
      'default-case-last': 'error',
      eqeqeq: ['error', 'always'],
      'logical-assignment-operators': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-param-reassign': 'error',
      'no-plusplus': 'error',
      'no-shadow': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      'no-useless-catch': 'error',
      'no-useless-rename': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'prefer-template': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
    },
  },
  {
    files: ['docs/**/*.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
];
