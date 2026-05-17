import baseConfig, { vue, prettier } from '../../eslint.config.js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...baseConfig,
  ...vue,
  ...prettier,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
