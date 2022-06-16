#!/usr/bin/env node
import pkg from '../package.json'
import { program } from 'commander'
import { initConfig } from './utils/config'
import { removeDBCache } from './utils/nedb'
import { diffInterface } from './generate/diff'
import { generateTypescript } from './generate/index'

// 配置执行参数
program
  .version(pkg.version, '-v, --version', '获取当前版本')
  .option('-i, --init', '初始化配置文件')
  .option('-g, --generate', '生成接口文档')
  .option('-r, --remove', '移除缓存')
  .option('-d, --diff', '当前项目Diff')

program.on('option:generate', () => {
  generateTypescript()
})

program.on('option:init', () => {
  initConfig()
})

program.on('option:diff', () => {
  diffInterface()
})

program.on('option:remove', () => {
  removeDBCache()
})

program.parse(process.argv)
