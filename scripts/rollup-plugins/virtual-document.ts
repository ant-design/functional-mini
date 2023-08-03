import { parse } from '@babel/core';
import _generator from '@babel/generator';
import { readFile } from 'fs/promises';

import _traverse from '@babel/traverse';
import * as types from '@babel/types';
import { resolveRoot } from '../utils';
import fs from 'fs/promises';
import { resolve } from 'path';
import babel from '@babel/core';

const traverse = (_traverse as any).default as typeof _traverse;
const generator = (_generator as any).default as typeof _generator;

export function virtualDocument() {
  return {
    name: 'virtual-document',
    async resolveId(source: string) {
      if (source === 'virtual-document') {
        return source;
      }
      return null;
    },
    async load(id) {
      if (id === 'virtual-document') {
        return babel.transformSync(
          await readFile(
            resolveRoot('scripts/rollup-plugins/assets/virtual-document.js'),
            'utf-8',
          ),
          {
            presets: [['@babel/preset-env', { modules: false }]],
          },
        ).code;
      }
      const code = await readFile(id, 'utf-8');
      let findDocument = false;
      const ast = parse(code, {
        sourceType: 'module',
      });
      traverse(ast, {
        Identifier(path) {
          if (types.isIdentifier(path.node, { name: 'document' })) {
            findDocument = true;
            path.node.name = 'virtualDocument';
          }
        },
      });
      ast.program.body.unshift(
        types.importDeclaration(
          [
            types.importSpecifier(
              types.identifier('virtualDocument'),
              types.identifier('virtualDocument'),
            ),
          ],
          types.stringLiteral('virtual-document'),
        ),
      );
      if (findDocument) {
        return generator(ast).code;
      }
      return null; // 其他ID应按通常方式处理
    },

    async generateBundle(options, _bundle, isWrite) {
      const sourceCodeDir = process.cwd();
      const outputDir = resolve(sourceCodeDir, options.dir);

      if (isWrite) {
        await fs.writeFile(
          resolve(outputDir, 'virtual-document.js'),
          `export { virtualDocument } from './_virtual/virtual-document.js';`,
        );
        await fs.writeFile(
          resolve(outputDir, 'virtual-document.d.ts'),
          `export { virtualDocument } from './_virtual/virtual-document.js';`,
        );
      }
    },
  };
}
