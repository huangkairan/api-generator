import fs from 'fs'
import path from 'path'
import { getConfig } from '../utils/config'
import { getQueryName, getRequestName, getResponseName, underlineToHump } from '../utils/name'
import { generateDir } from '../utils/file'
import { jsonSchemaToDts } from '../utils/jsonSchema'
import { formatCode } from '../utils/prettify'
import { IApiInfoResponse } from '../typing/yapi'

/**
 * @description 生成声明文件
 * @param apis
 * @param projectName
 * @param modularId
 */
export async function generateDeclaration (apis: IApiInfoResponse[], projectName: string, modularId: number, onProgress?: () => void): Promise<void> {
  if (!apis || apis.length === 0) {
    throw new Error('生成的接口列表为空')
  }
  const config = getConfig()
  // 声明文件模板储存地址
  const dtsTemplate = fs.readFileSync(path.join(__dirname, '../templates/dtsTemplate/dts.tpl')).toString()
  // 声明文件Body模板存储路径
  const dtsBodyTemplate = fs.readFileSync(path.join(__dirname, '../templates/dtsTemplate/body.tpl')).toString()

  const responseContent = []
  const requestContent = []

  // 标记module的起始，方便后续更新
  requestContent.push(`//#region request:${modularId}`)
  responseContent.push(`//#region response:${modularId}`)
  // 遍历接口拼接声明文件内容
  for (let index = 0; index < apis.length; index++) {
    const api = apis[index]
    try {
      // 获取response声明文件
      const responseDts = api.detail.response ? await jsonSchemaToDts(api.detail.response, getResponseName(api)) : undefined
      // 获取body声明文件
      const bodyDts = api.detail.body ? await jsonSchemaToDts(api.detail.body, getRequestName(api)) : undefined
      // 获取query声明文件
      const queryDts = generateQueryDts(api)
      // 拼接response
      if (responseDts) {
        responseContent.push(responseDts)
      }
      // 拼接request
      if (bodyDts) {
        requestContent.push(bodyDts)
      }
      // 拼接query
      if (queryDts) {
        requestContent.push(queryDts)
      }
    } catch (err) {
      throw new Error(`接口声明：${api.path} 生成失败:${err.toString}`)
    }
    onProgress && onProgress()
  }
  // 标记module的结束，方便后续更新
  responseContent.push(`//#endregion response:${modularId}`)
  requestContent.push(`//#endregion request:${modularId}`)

  // 校验声明文件存放路径
  const dtsFilePath = path.resolve(`${config.outDir}/${underlineToHump(projectName)}`)
  // 声明文件的完整文件名
  const dtsFileName = path.resolve(`${dtsFilePath}/${underlineToHump(projectName, true)}.d.ts`)
  // 声明文件内容
  let dtsContent = ''
  // 是否已经存在声明文件
  if (fs.existsSync(dtsFileName)) {
    // 源文件
    const originContent = fs.readFileSync(dtsFileName).toString()
    const requestReg = new RegExp(`\\/\\/\\s*#region\\s*request:${modularId}[\\s\\S]*\\/\\/\\s*#endregion\\s*request:${modularId}`)
    const responseReg = new RegExp(`\\/\\/\\s*#region\\s*response:${modularId}[\\s\\S]*\\/\\/\\s*#endregion\\s*response:${modularId}`)
    const isExistModule = requestReg.test(originContent) || responseReg.test(originContent)
    // 已存在该module，根据#region request / #region response 标识去修改
    if (isExistModule) {
      // 替换模块位置
      dtsContent = originContent
        .replace(requestReg, requestContent.join('\r\n'))
        .replace(responseReg, responseContent.join('\r\n'))
    } else {
      // 不存在时，根据 #append 这个标识去新增
      dtsContent = originContent
        .replace(/(\s*\/\/\s*#append\s*request)/, `\r\n${requestContent.join('\r\n')} $1`)
        .replace(/(\s*\/\/\s*#append\s*response)/, `\r\n${responseContent.join('\r\n')} $1`)
    }
    // 判断tslint配置
    const tslintReg = /\/\/\s*@ts-ignore/
    const eslintReg = /\/\*\s*eslint-disable\s*\*\//
    const hasTslintIgnore = tslintReg.test(dtsContent)
    const hasEslintIgnore = eslintReg.test(dtsContent)
    if (config.tsIgnore && !hasTslintIgnore) {
      if (hasEslintIgnore) {
        dtsContent = dtsContent.replace(eslintReg, '/* eslint-disable */\n// @ts-ignore\n')
      } else {
        dtsContent = `// @ts-ignore\n${dtsContent}`
      }
    }
    if (!config.tsIgnore && hasTslintIgnore) {
      dtsContent = dtsContent.replace(tslintReg, '')
    }
    // 判断eslint配置
    if (config.esLintIgnore && !hasEslintIgnore) {
      dtsContent = `/* eslint-disable */\n${dtsContent}`
    }
    if (!config.esLintIgnore && hasEslintIgnore) {
      dtsContent = dtsContent.replace(eslintReg, '')
    }
  } else {
    // 如果不存在该文件，则从模板新增
    const bodyContent = dtsBodyTemplate
      .replace('{ResponseData}', responseContent.join('\r\n')) // 替换response
      .replace('{RequestData}', requestContent.join('\r\n')) // 替换request
    // 校验忽略文本
    const ignore = `${config.esLintIgnore ? '/* eslint-disable */\n' : ''}${config.tsIgnore ? '// @ts-ignore\n' : ''}`
    dtsContent = dtsTemplate
      .replace('{ProjectName}', underlineToHump(projectName, true)) // 替换命名空间名
      .replace('{BodyData}', bodyContent) // 替换Body
      .replace('{Ignore}', ignore) // 替换忽略校验
  }
  // 生成输出文件夹
  generateDir(dtsFilePath)
  // 写入声明文件
  fs.writeFileSync(dtsFileName, formatCode(dtsContent))
}

/**
 * @description 生成Get请求参数
 * @param apis
 * @param projectName
 * @param modularId
 */
function generateQueryDts (api: IApiInfoResponse) {
  if (!api?.detail?.query || api.detail.query.length === 0) return undefined
  const queryBody = api.detail.query.map(e => {
    let template = e.desc
      ? `/**
      * ${e.desc}
      */
      `
      : ''
    template += `${e.name}${e.required ? '' : '?'}:${e.type};`
    return template
  })
  queryBody.push('[k: string]: any;')
  const content = `interface ${getQueryName(api)}{${queryBody.join('\r\n')}}`
  return content
}
