import { http } from '../utils/http'
import inquirer, { QuestionCollection } from 'inquirer'
import { zhCN2EN } from '../utils/name'
import { IListItem, IProjectResponse } from '../typing/yapi'
import { getConfig } from '../utils/config'

/**
 * @description 获取项目列表
 */
export async function getProjectList (groupId: number): Promise<IListItem[]> {
  return new Promise((resolve) => {
    // 拉取项目列表
    http.get('/api/project/list', {
      params: {
        group_id: groupId,
        page: 1,
        limit: 100
      }
    }).then(async projectReq => {
      // 抽取关键数据
      const projectList: IListItem[] = projectReq?.data?.data?.list?.map((e: any) => {
        return {
          name: e.name,
          id: e._id
        }
      }) || []
      // 判断数据是否为空
      if (projectList.length === 0) {
        throw new Error('当前暂无项目列表')
      }
      resolve(projectList)
    }).catch(err => {
      throw new Error(`yapi拉取项目列表失败：${err}`)
    })
  })
}

/**
 * @description 获取项目ID
 */
export async function getProjectId (groupId: number): Promise<IProjectResponse> {
  return new Promise(async (resolve) => {
    const projectList = await getProjectList(groupId)
    // 选择分组
    const promptList: QuestionCollection = [{
      type: 'list',
      message: '请选择要生成的项目:',
      name: 'name',
      choices: projectList.map(e => e.name),
      pageSize: 20
    }]
    const projectName = await inquirer.prompt(promptList)
    const project = projectList.find(e => e.name === projectName.name)
    // 选择的项目ID
    const projectId = project?.id
    if (!projectId) {
      throw new Error('选择的项目不存在')
    }
    if (Object.keys(getConfig().projectMapping).every(e => e.toString() !== projectId.toString())) {
      throw new Error(`项目ID: ${projectId} 未在projectMapping中配置映射关系`)
    }
    resolve({
      projectId: projectId,
      projectName: await zhCN2EN(projectName.name)
    })
  })
}
