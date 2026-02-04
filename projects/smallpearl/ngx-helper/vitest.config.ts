// Learn more about Vitest configuration options at https://vitest.dev/config/
/// <reference types="vitest" />
import { defineConfig } from 'vite';

import angular from '@analogjs/vite-plugin-angular';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [angular(), viteTsConfigPaths({ root: '../../../' })],
  test: {
    globals: true,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    server: {
      deps: {
        inline: ['@ngneat/spectator'],
      },
    },
  },
}));
