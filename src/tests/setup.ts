import Module from 'node:module';
import path from 'node:path';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

const origResolve = (Module as any)._resolveFilename;
const reactDomPath = require.resolve('react-dom');
const reactDomDir = path.dirname(reactDomPath);
const reactPath = require.resolve('react', { paths: [reactDomPath] });
const reactDir = path.dirname(reactPath);

(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === 'react') return reactPath;
  if (request.startsWith('react/')) {
    return origResolve.call(this, request, { paths: [reactDir], filename: reactPath }, isMain, options);
  }
  if (request === 'react-dom') return reactDomPath;
  if (request.startsWith('react-dom/')) {
    return origResolve.call(this, request, { paths: [reactDomDir], filename: reactDomPath }, isMain, options);
  }
  return origResolve.call(this, request, parent, isMain, options);
};


afterEach(cleanup);

