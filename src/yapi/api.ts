import { IApiDetailResult, IApiInfoResponse } from '../typing/yapi'
import { http } from '../utils/http'

// 获取api列表
export async function getApiList (modularId: number): Promise<IApiInfoResponse[]> {
  return new Promise((resolve) => {
    http.get('/api/interface/list_cat', {
      params: {
        page: 1,
        limit: 1000,
        catid: modularId
      }
    }).then(async apiReq => {
      const apiList: IApiInfoResponse[] = []
      for (const item of apiReq?.data?.data?.list ?? []) {
        const detail = await getApiDetail(item._id)
        apiList.push({
          id: item._id,
          title: item.title,
          path: item.path,
          method: item.method,
          detail: detail.detail,
          success: detail.success,
          message: detail.message
        })
      }
      resolve(apiList)
    }).catch(err => {
      throw new Error(`yapi拉取接口列表失败：${err.toString()}`)
    })
  })
}

// 获取api详情
export async function getApiDetail (apiId: number): Promise<IApiDetailResult> {
  return new Promise((resolve) => {
    let success = true
    let message = ''
    http.get('/api/interface/get', {
      params: {
        id: apiId
      }
    }).then(async apiReq => {
      const apiDetail = apiReq.data.data
      let body
      let response
      // 解析Response
      try {
        response = apiDetail?.res_body ? JSON.parse(apiDetail.res_body) : undefined
      } catch (err) {
        response = undefined
        success = false
        message = `接口：${apiReq.data?.data?.path} Response解析失败`
      }
      // 解析Body
      try {
        body = apiDetail?.req_body_other ? JSON.parse(apiDetail.req_body_other) : undefined
      } catch (err) {
        response = undefined
        success = false
        message = `接口：${apiReq.data?.data?.path} Body解析失败`
      }
      const result: IApiDetailResult = {
        success: success,
        message: message,
        detail: {
          // 路径参数
          urlParams: apiDetail?.req_params?.map((e: any) => {
            return {
              desc: e.desc,
              name: e.name,
              type: 'string|number',
              required: true
            }
          }),
          // 请求参数
          query: apiDetail?.req_query?.map((e: any) => {
            return {
              name: e.name,
              type: 'string|number',
              desc: e.desc,
              required: e.required === '1'
            }
          }),
          // 请求体
          body: body,
          // 返回数据
          response: response,
          // 更新时间
          updateTime: apiDetail?.up_time ?? 0,
          // 接口名
          title: apiDetail?.title ?? '',
          // 接口路径
          url: apiDetail?.path ?? ''
        }
      }
      resolve(result)
    }).catch(err => {
      throw new Error(`yapi拉取接口详情失败：${err.toString()}`)
    })
  })
}
