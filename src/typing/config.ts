// 项目映射
export interface IProjectMapping {
  // api方法
  exportName: string,
  // 通用封装
  wrapper: string
}

// 配置文件
export interface IConfig {
  // 账号
  account: string,
  // 密码
  password: string,
  // 原地址
  originUrl: string,
  // 输出目录
  outDir: string,
  // 请求声明模块
  fetchModule: string,
  // 项目跟请求方法映射
  projectMapping: { [key: number]: IProjectMapping },
  // 请求文件路径
  requestFilePath: string,
  // 忽略ts校验
  tsIgnore: boolean,
  // 忽略eslint
  esLintIgnore: boolean
}
