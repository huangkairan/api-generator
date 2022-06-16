import { Login } from './yapi/login'
import { initAxios } from './utils/http'
import { getGroupList } from './yapi/group'
import { getProjectList } from './yapi/project'
import { getModularList } from './yapi/modular'
import { getApiList } from './yapi/api'
import { zhCN2EN } from './utils/name'
import { generateInterface } from './generate/interface'
import { generateDeclaration } from './generate/declaration'
import { getUpdateList, generateUpdateInterface, getCacheList } from './generate/diff'
import { setConfigRootPath, generateDefaultConfig, existConfig, getConfig } from './utils/config'
export {
  // 设置配置文件根路径
  setConfigRootPath,
  // 初始化请求方法
  initAxios,
  // 判断是否有配置
  existConfig,
  // 获取配置
  getConfig,
  // 生成默认配置
  generateDefaultConfig,
  // 登录
  Login,
  // 获取分组列表
  getGroupList,
  // 获取项目分组
  getProjectList,
  // 获取项目分组
  getModularList,
  // 获取api详细数据
  getApiList,
  // 生成声明文件
  generateDeclaration,
  // 生成接口文件
  generateInterface,
  // 获取缓存数据
  getCacheList,
  // 获取需要更新的列表
  getUpdateList,
  // 生成更新的接口文件
  generateUpdateInterface,

  // 工具类
  zhCN2EN
}
