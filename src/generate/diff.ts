import path from 'path'
import inquirer from 'inquirer'
import { Login } from '../yapi/login'
import { clg } from '../utils/console'
import { initAxios } from '../utils/http'
import { getConfig } from '../utils/config'
import { generateDir } from '../utils/file'
import { getDBCache, updateDB } from '../utils/nedb'
import { getApiList } from '../yapi/api'
import { generateInterface } from '../generate/interface'
import { generateDeclaration } from '../generate/declaration'
import { IApiCache, IApiInfoList, IDiffInterface, IDiffUpdateResponse } from '../typing/yapi'
import { getDiffInterfaceList } from '../yapi/diff'

/**
 * @description 获取缓存数据
 */
export function getCacheList (data: IApiInfoList[], projectName: string, projectId: number): IApiCache[] {
  let apiList: IApiCache[] = []
  apiList = data.reduce((pre: IApiCache[], curr: IApiInfoList) => {
    pre.push({
      modularId: curr.modularId,
      modularName: curr.modularName,
      projectName: projectName,
      projectId: projectId,
      basePath: curr.basePath,
      cwd: process.cwd(),
      list: curr.list.map(e => ({
        id: e.id,
        updateTime: e.detail.updateTime
      }))
    })
    return pre
  }, apiList)
  return apiList
}

/**
 * @description 获取更变接口列表
 */
export async function getUpdateList (localCaches: IApiCache[]): Promise<IApiCache[]> {
  // 获取最新的接口数据
  let latestInterfaces = await getDiffInterfaceList(Array.from(new Set(localCaches.map(e => e.projectId))))
  // 筛选出本地存在的模块
  const modularIds = localCaches.map(e => e.modularId)
  latestInterfaces = new Map(Array.from(latestInterfaces).filter(e => modularIds.includes(e[0])))
  // 拼装本地数据，按模块ID划分
  let localInterfaces: IDiffInterface = new Map()
  localInterfaces = localCaches.reduce((pre, curr) => {
    pre.set(curr.modularId, curr.list.map(e => ({
      id: e.id,
      upTime: e.updateTime
    })))
    return pre
  }, localInterfaces)
  return new Promise(async (resolve) => {
    const updateList: IApiCache[] = []
    for (const item of latestInterfaces.entries()) {
      item[1].sort((a, b) => {
        return a.id > b.id ? 1 : -1
      })
      const local = localInterfaces.get(item[0])?.sort((a, b) => {
        return a.id > b.id ? 1 : -1
      }) || []
      const modal = localCaches.find(c => c.modularId === item[0])
      if (!modal) continue
      if (JSON.stringify(item[1]) !== JSON.stringify(local)) { updateList.push(modal) }
    }
    resolve(updateList)
  })
}

/**
 * @description 生成更新的接口文档
 */
export async function generateUpdateInterface (list: IApiCache[]): Promise<IDiffUpdateResponse[]> {
  // 获取参数
  const config = getConfig()
  const result: IDiffUpdateResponse[] = []
  let apiInfos: IApiInfoList[] = []
  for (const item of list) {
    // 获取接口列表
    const apiList = await getApiList(item.modularId)
    // 生成输出文档
    const outdir = path.resolve(config.outDir)
    generateDir(outdir)
    // 生成声明文件
    generateDeclaration(apiList, item.projectName, item.modularId)
    // 生成接口文件
    generateInterface(apiList, item.projectName, item.projectId, item.basePath, item.modularId)
    // 添加到记录
    apiInfos = [{
      list: apiList,
      modularId: item.modularId,
      modularName: item.modularName,
      basePath: item.basePath
    }]
    result.push({
      list: apiInfos,
      projectName: item.projectName,
      projectId: item.projectId
    })
  }
  return result
}

/**
 * @description 接口diff
 */
export async function diffInterface (): Promise<void> {
  // 初始化请求方法
  initAxios()
  // 登录
  await Login()
  // 获取当前项目缓存
  const caches = await getDBCache()
  if (!caches || caches.length === 0) {
    clg('yellow', '> 当前暂无接口缓存，请重新生成接口后恢复缓存')
    return
  }
  // 获取更新的接口列表
  const updateList = await getUpdateList(caches)
  if (updateList && updateList.length === 0) {
    clg('green', '接口已经是最新版')
    return
  }
  // 选择更新的模块
  const promptList = [{
    type: 'checkbox',
    message: '请选择要更新的模块:',
    name: 'modularNames',
    choices: updateList.map(e => e.modularName),
    pageSize: 100
  }]
  // 获取需要更新的模块
  const { modularNames } = await inquirer.prompt(promptList)
  // 选择的模块列表
  const selectModulars = updateList.filter(e => modularNames.includes(e.modularName))
  if (selectModulars.length === 0) {
    clg('green', '> 取消接口更新')
    return
  }
  // 生成更新的接口文档
  const diffResult = await generateUpdateInterface(selectModulars)
  for (const item of diffResult) {
    // 更新API缓存
    updateDB(item.list, item.projectName, item.projectId)
  }
  console.log('> 接口更新完成')
}
