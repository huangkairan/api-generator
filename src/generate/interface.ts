import fs from 'fs'
import path from 'path'
import { getConfig } from '../utils/config'
import { generateDir } from '../utils/file'
import { formatCode } from '../utils/prettify'
import { getBodyPath, getInterfaceName, getNamespace, getQueryPath, getResponesPath, underlineToHump } from '../utils/name'
import { IApiDetailParam, IApiInfoResponse } from '../typing/yapi'

/**
 * @description 生成API请求方法
 * @param apis
 * @param projectName
 * @param projectId
 * @param basePath
 * @param modularId
 */
export function generateInterface (apis: IApiInfoResponse[], projectName: string, projectId: number, basePath: string, modularId: number, onProgress?: () => void) {
  const config = getConfig()
  const apiTemplate = fs.readFileSync(path.join(__dirname, '../templates/apiTemplate/api.tpl')).toString()
  if (!(projectId in config.projectMapping)) {
    throw new Error(`生成失败，项目：${projectName}，ID：${projectId} 未配置 projectMapping`)
  }

  const apiList = []
  // 标记module的起始，方便后续更新
  if (apis && apis.length > 0) {
    apiList.push(`//#region interface:${modularId}`)
  }
  for (let index = 0; index < apis.length; index++) {
    const api = apis[index]
    try {
      // 添加接口内容
      apiList.push(generateApiFunction(api, projectName, projectId))
    } catch (err) {
      throw new Error(`接口：${api.path} 生成失败：${err.toString()}`)
    }
    onProgress && onProgress()
  }
  // 标记module的结束，方便后续更新
  if (apis && apis.length > 0) {
    apiList.push(`//#endregion interface:${modularId}`)
  }
  // api文件存放路径
  const apiFilePath = path.resolve(`${config.outDir}/${underlineToHump(projectName)}`)
  // api文件的完整文件名
  const apiFileName = path.resolve(`${apiFilePath}/index.ts`)
  // api文件内容
  let apiContent = ''
  // 是否已经存在声明文件
  if (fs.existsSync(apiFileName)) {
    // 源文件
    let originContent = fs.readFileSync(apiFileName).toString()
    // 判断requestFilePath是否变更
    const requestFilePathReg = /import\s\*\sas\sdefs\sfrom\s["|'|`][\S]*["|'|`]/
    const requestScript = originContent.match(requestFilePathReg)?.[0] ?? ''
    const newRequestScript = `import * as defs from '${config.requestFilePath}';`
    if (requestScript && requestScript !== newRequestScript) {
      originContent = originContent.replace(
        requestFilePathReg,
        newRequestScript
      )
    }
    // 判断模块是否存在了
    const interfaceExp = new RegExp(`\\/\\/\\s*#region\\s*interface:${modularId}`)
    const isExistModule = interfaceExp.test(originContent)
    // 已存在该module，根据#region interface 标识去修改
    if (isExistModule) {
      const reg = new RegExp(`\\/\\/\\s*#region\\s*interface:${modularId}[\\s\\S]*\\/\\/\\s*#endregion\\s*interface:${modularId}`)
      apiContent = originContent.replace(reg, apiList.join('\r\n'))
    } else {
      // 不存在时，直接添加在最后
      apiContent = `${originContent}\r\n${apiList.join('\r\n')}`
    }
  } else {
    // 统一返回体wrapper
    const wrapper = config.projectMapping[projectId].wrapper
    // 请求方法文件路径
    const requestFilePath = config.requestFilePath
    // 校验忽略文本
    const ignore = `${config.esLintIgnore ? '/* eslint-disable */\n' : ''}${config.tsIgnore ? '// @ts-ignore\n' : ''}`
    // 如果不存在该文件，则从模板新增
    apiContent = apiTemplate
      .replace('{RequestFilePath}', requestFilePath) // 替换请求方法文件路径
      .replace('{Wrapper}', wrapper
        ? `interface IResponseWrapper<T> ${wrapper} \r\n`
        : '') // 配置统一请求返回体
      .replace('{Mock}', `${config.originUrl}/mock/${projectId}${basePath || ''}`) // 替换mock路径
      .replace('{Ignore}', ignore) // 替换忽略校验
      .replace('{dtsModule}', config.fetchModule)
    apiContent += apiList.join('\r\n')
  }
  // 生成输出文件夹
  generateDir(apiFilePath)
  fs.writeFileSync(apiFileName, formatCode(apiContent))
}

// 生成Api请求方法
function generateApiFunction (api: IApiInfoResponse, projectName: string, projectId: number) {
  const config = getConfig()
  const apiBodyTemplate = fs.readFileSync(path.join(__dirname, '../templates/apiTemplate/body.tpl')).toString()
  // 获取命名空间名
  const namespaceName = getNamespace(projectName)
  // 是否需要body
  const isNeedBody = ['post', 'put'].includes(api.method.toLocaleLowerCase())
  // 接口描述
  const description = api.title
  // 接口名字
  const interfaceName = getInterfaceName(api)
  // URL参数
  const urlParams = `${getUrlQuery(api.detail.urlParams)}\n`
  // 参数Query
  const query = api.detail.query && api.detail.query.length > 0 ? `query: ${getQueryPath(namespaceName, api)},\n` : ''
  // 参数Body
  const body = isNeedBody && api.detail.body ? `body: ${getBodyPath(namespaceName, api)},\n` : ''
  // 返回的类型
  const response = api.detail.response
    ? config.projectMapping[projectId].wrapper
      ? `IResponseWrapper<${getResponesPath(namespaceName, api)},>`
      : `${getResponesPath(namespaceName, api)},`
    : 'T'
  // 映射的方法名
  const mapping = config.projectMapping[projectId].exportName
  // 请求方法
  const method = api.method.toLocaleLowerCase()
  // 请求URL
  const url = api.path.replace(/{(.*?)}/g, '${$1}')
  // 请求Body
  const bodyParam = isNeedBody ? api.detail.body ? 'body,' : 'undefined,' : ''
  // 请求Query
  const queryParam = api.detail.query && api.detail.query.length > 0 ? 'params: query' : ''
  const bodyContent = apiBodyTemplate.replace('{Description}', description)
    .replace('{InterfaceName}', `${interfaceName}${response === 'T' ? '<T = any>' : ''}`)
    .replace('{UrlParams}', urlParams)
    .replace('{Query}', query)
    .replace('{Body}', body)
    .replace('{Response}', response)
    .replace('{Mapping}', mapping)
    .replace('{Method}', method)
    .replace('{Url}', url)
    .replace('{BodyParam}', bodyParam)
    .replace('{QueryParam}', queryParam)
  return bodyContent
}

// 获取路径参数
function getUrlQuery (params: IApiDetailParam[]) {
  return params && params.length > 0 ? params.map(e => `${e.name}: ${e.type}`).join(',') + ',' : ''
}
