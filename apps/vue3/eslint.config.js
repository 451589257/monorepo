import baseConfig, { vue } from '../../eslint.config.js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...baseConfig,
  ...vue,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
