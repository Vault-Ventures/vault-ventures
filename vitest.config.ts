import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const reactDomPath = require.resolve('react-dom');
const reactEntry = require.resolve('react', { paths: [reactDomPath] });
const reactDir = path.dirname(require.resolve('react/package.json', { paths: [reactDomPath] }));
const reactDomDir = path.dirname(require.resolve('react-dom/package.json'));
const reactRouterDomDir = path.dirname(require.resolve('react-router-dom/package.json'));
const reactRouterDomPath = require.resolve('react-router-dom');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react/jsx-runtime', replacement: `${reactDir}/jsx-runtime.js` },
      { find: 'react/jsx-dev-runtime', replacement: `${reactDir}/jsx-dev-runtime.js` },
      { find: /^react$/, replacement: reactEntry },
      { find: /^react\/(.*)$/, replacement: `${reactDir}/$1` },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react-dom\/(.*)$/, replacement: `${reactDomDir}/$1` },
      { find: /^react-router-dom$/, replacement: reactRouterDomPath },
      { find: /^react-router-dom\/(.*)$/, replacement: `${reactRouterDomDir}/$1` },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.tsx'],
    server: {
      deps: {
        inline: [/react-router/, /react-router-dom/],
      },
    },
  },
});
