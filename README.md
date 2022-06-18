# api-generator

一键生成 TS 类型文件和基于 axios 封装的请求方法

# how to use

```
  npm i -g @kairan.huang/api-generator

  api --help
Options:
  -v, --version   获取当前版本
  -i, --init      初始化配置文件
  -g, --generate  生成接口文档
  -r, --remove    移除缓存
  -d, --diff      当前项目Diff

```


# api.config.js
```
module.exports = {
  // 账号
  account: 'xxx@xxx.cn',
  // 密码
  password: 'xxxxxx',
  // Yapi网址链接
  originUrl: 'https://yapi.xxxx.cn',
  // 请求声明模块
  fetchModule: 'import { AxiosPromise as RequestPromise , AxiosRequestConfig as RequestConfig } from "axios";',
  // 输出目录
  outDir: './src/apis',
  // 项目跟请求方法映射
  projectMapping: {
  	// 项目跟请求方法映射（projectId为生成目录id）
  	// 参考url https://yapi.xxxx.cn/project/12/interface/api
  	// 12是projectId,当未配置时api也会有相应的projectId提示
    12: {
      exportName: 'API',
      // 返回报文泛式
      // wrapper: '{ code: string, message: string, data: T }',
    },
  },
  // 请求体实例文件路径
  requestFilePath: 'src/apis/',
  // 忽略ts校验
  tsIgnore: true,
  // 忽略eslint
  esLintIgnore: true,
};
```
