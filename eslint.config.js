import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';

const base = defineConfig([
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);

const react = defineConfig([
  {
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);

const vueConfig = defineConfig([
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      vue,
    },
  },
]);

const node = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
  },
]);

const prettier = defineConfig([eslintConfigPrettier]);

const nestjs = defineConfig([
  {
    files: ['servers/nestjs/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL('./servers/nestjs', import.meta.url)),
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]);

const root = defineConfig([
  globalIgnores(['dist', 'eslint.config.js', '**/postcss.config.js']),
  ...base,
  ...prettier,
  ...nestjs,
]);

export { base, react, vueConfig as vue, node, prettier, nestjs, root };
export default root;
