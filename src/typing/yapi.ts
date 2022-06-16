// 项目返回信息
export interface IProjectResponse {
  projectId: number;
  projectName: string;
}

// 模块返回信息
export interface IModularResponse {
  modularId: number;
  modularName: string;
  basePath: string;
}

// 模块返回信息
export interface IModularLiatResponse {
  modularList: IListItem[];
  basePath: string;
}

// api信息信息
export interface IApiInfoList {
  list: IApiInfoResponse[];
  modularId: number;
  modularName: string;
  basePath: string;
}

// api信息返回信息
export interface IApiInfoResponse {
  id: number,
  title: string,
  path: string,
  method: string,
  detail: IApiDetail
  success: boolean,
  message: string
}

export interface IApiDetailParam {
  desc: string,
  name: string,
  type: string,
  required: boolean
}

export interface IApiDetailResult {
  success: boolean
  message: string
  detail: IApiDetail
}

// API详细信息
export interface IApiDetail {
  // 路径参数
  urlParams: IApiDetailParam[],
  // 请求参数
  query: IApiDetailParam[],
  // 请求体
  body: any,
  // 返回数据
  response: any,
  // 更新时间
  updateTime: number,
  // 接口名
  title: string,
  // 接口路径
  url: string
}

// 列表信息
export interface IListItem {
  name: string,
  id: number
  basepath: string,
}

// diff的数据
export interface IDiffInfo {
  id: number,
  title: string,
  url: string
}

export type IApiCache = {
  // 模块ID
  modularId: number;
  // 模块名称
  modularName: string;
  // 项目名
  projectName: string;
  // 项目ID
  projectId: number;
  // basePath
  basePath: string;
  // 当前项目路径
  cwd?: string;
  // 接口信息
  list: IApiCacheItem[]
}

// 接口缓存数据
export interface IApiCacheItem {
  // 接口ID
  id: number;
  // 更新时间
  updateTime: number;
}

// 接口更新返回参数
export interface IDiffUpdateResponse {
  list: IApiInfoList[],
  projectName: string,
  projectId: number
}

// diff所需的接口数据
export type IDiffInterface = Map<number, IDiffInterfaceItem[]>

export interface IDiffInterfaceItem {
  upTime: number,
  id: number,
}
