import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  sonarjs.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'no-restricted-imports': ['error', { patterns: ['../*'] }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
