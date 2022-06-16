/* eslint-disable @typescript-eslint/no-var-requires */
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'
import { cleandir } from 'rollup-plugin-cleandir'
import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs'
import alias from '@rollup/plugin-alias'
import copy from 'rollup-plugin-copy'

const extensions = ['.js', '.ts']

export default {
  input: ['./src/index.ts', './src/core.ts'],
  output: {
    dir: './lib/core',
    format: 'cjs'
  },
  plugins: [
    cleandir('./lib'),
    // 处理#!/usr/bin/env node
    preserveShebangs(),
    alias({
      entries: [
        { find: '@', replacement: '../src' }
      ]
    }),
    // 解析typescript
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNEXT'
        }
      }
    }),
    // 解析node_modules
    nodeResolve({
      extensions,
      modulesOnly: true,
      preferredBuiltins: false
    }),
    // 将JSON转换为ES6版本
    json(),
    // 代码压缩
    terser(),
    // 拷贝静态文件
    copy({
      targets: [
        { src: 'src/templates/', dest: 'lib/' }
      ]
    })
  ]
}
