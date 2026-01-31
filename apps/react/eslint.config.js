import baseConfig, { react } from '../../eslint.config.js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...baseConfig,
  ...react,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
