import { IListItem } from '../typing/yapi'
import { http } from '../utils/http'
import inquirer, { QuestionCollection } from 'inquirer'

// 获取分组列表
export function getGroupList (): Promise<IListItem[]> {
  return new Promise((resolve) => {
    // 拉取分组列表
    http.get('/api/group/list').then(async (groupRes) => {
      // 抽取关键数据
      const groupList: IListItem[] = groupRes?.data?.data?.map((e: any) => {
        return {
          name: e.group_name,
          id: e._id
        }
      }) || []
      // 判断数据是否为空
      if (groupList.length === 0) {
        throw new Error('当前暂无分组列表')
      }
      resolve(groupList)
    }).catch(err => {
      throw new Error(`yapi拉取分组列表失败：${err.toString()}`)
    })
  })
}

// 获取分组ID
export async function getGroupId (): Promise<number> {
  return new Promise(async (resolve) => {
    const groupList = await getGroupList()
    // 选择分组
    const promptList: QuestionCollection = [{
      type: 'list',
      message: '请选择要生成的分组:',
      name: 'name',
      choices: groupList.map((e) => e.name),
      pageSize: 20
    }]
    const groupName = await inquirer.prompt(promptList)
    // 选择的分组ID
    const groupId = groupList.find((e) => e.name === groupName.name)?.id
    if (!groupId) {
      throw new Error('选择的分组不存在')
    }
    resolve(groupId)
  })
}
