import baseConfig, { prettier } from '../../eslint.config.js';
import { defineConfig } from 'eslint/config';

export default defineConfig([...baseConfig, ...prettier]);
