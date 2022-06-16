import { IDiffInterface, IDiffInterfaceItem } from '../typing/yapi'
import { http } from '../utils/http'

// 获取Diff需要的接口列表
export async function getDiffInterfaceList (projectIds: number[]): Promise<IDiffInterface> {
  return new Promise(async (resolve) => {
    let interfaces: IDiffInterface = new Map()
    for (const projectId of projectIds) {
      interfaces = new Map([...interfaces, ...await getDiffInterface(projectId)])
    }
    resolve(interfaces)
  })
}

// 获取diff的接口信息
async function getDiffInterface (projectId: number): Promise<IDiffInterface> {
  return new Promise((resolve) => {
    http.get('/api/interface/list_menu', {
      params: {
        project_id: projectId
      }
    }).then(res => {
      let result: IDiffInterface = new Map()
      result = res.data.data.reduce((pre: IDiffInterface, curr: any) => {
        if (!pre.has(curr._id)) {
          pre.set(curr._id, curr.list.map((e: any) => {
            const model: IDiffInterfaceItem = {
              id: e._id,
              upTime: e.up_time
            }
            return model
          }))
        }
        return pre
      }, result)
      resolve(result)
    }).catch(err => {
      throw new Error(`yapi拉取Diff接口列表失败：${err.toString()}`)
    })
  })
}
