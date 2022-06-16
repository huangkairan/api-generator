import inquirer from 'inquirer'
import { Login } from '../yapi/login'
import { clg } from '../utils/console'
import { getApiList } from '../yapi/api'
import { getGroupId } from '../yapi/group'
import { generateDir } from '../utils/file'
import { getModular } from '../yapi/modular'
import { getProjectId } from '../yapi/project'
import { generateInterface } from './interface'
import { generateDeclaration } from '../generate/declaration'
import { initConfig, existConfig, getConfig } from '../utils/config'
import path from 'path'
import { initAxios } from '../utils/http'
import { updateDB } from '../utils/nedb'
import { IApiInfoList } from '../typing/yapi'
import { Progress } from '../utils/progress'

/**
 * @description 生成ts文件
 */
export async function generateTypescript (): Promise<void> {
  // 判断是否有配置文件
  if (!existConfig()) {
    const res = await inquirer.prompt({
      type: 'confirm',
      message: '当前项目不存在config，是否生成默认配置',
      name: 'isGenerate',
      default: false
    })
    if (res.isGenerate) {
      initConfig()
      return
    } else {
      clg('red', '已取消生成默认配置，请完善配置后重试')
      return
    }
  }
  // 初始化请求方法
  initAxios()
  // 登录
  await Login()
  // 选择分组
  const groupId = await getGroupId()
  // 选择项目
  const { projectId, projectName } = await getProjectId(groupId)
  // 选择模块
  const modulars = await getModular(projectId)
  // 定义进度条
  const progress = new Progress('> yapi接口信息拉取', modulars.length, () => {
    progress.clear()
    clg('yellow', '> yapi接口信息拉取成功')
  })
  const apiInfos: IApiInfoList[] = []
  const errorList: string[] = []
  // 批量拉取接口信息
  for (let index = 0; index < modulars.length; index++) {
    const item = modulars[index]
    const interfaceList = await getApiList(item.modularId)
    errorList.push(...interfaceList.filter(e => !e.success).map(e => e.message))
    apiInfos.push({
      list: interfaceList,
      modularId: item.modularId,
      modularName: item.modularName,
      basePath: item.basePath
    })
    progress.push(index + 1)
  }
  const config = getConfig()
  // 创建输出文件夹
  const outdir = path.resolve(config.outDir)
  generateDir(outdir)
  // 获取接口总数
  const sum = apiInfos.reduce((pre, curr) => {
    pre += curr.list.length
    return pre
  }, 0)
  const dtsProgress = new Progress('> 正在生成声明文件', sum)
  let dtsProgressCurr = 0
  const apiProgress = new Progress('> 正在生成接口文件', sum)
  let apiProgressCurr = 0
  // 生成声明文件
  for (const item of apiInfos) {
    // 生成声明文件
    await generateDeclaration(item.list, projectName, item.modularId, () => {
      dtsProgressCurr++
      dtsProgress.push(dtsProgressCurr)
    })
    // 生成接口文件
    await generateInterface(item.list, projectName, projectId, item.basePath, item.modularId, () => {
      apiProgressCurr++
      apiProgress.push(apiProgressCurr)
    })
  }
  clg('yellow', '> 生成成功')
  if (errorList.length) {
    clg('yellow', '> 生成时有以下接口异常，已默认使用any代替：')
    clg('red', `${errorList.join('\n')}\n请检查Yapi是否规范`)
  }
  // 更新缓存
  updateDB(apiInfos, projectName, projectId)
}
