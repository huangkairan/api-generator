import { clg } from '../utils/console'
import { getConfig } from '../utils/config'
import { http, setCookie } from '../utils/http'

export async function Login (): Promise<void> {
  const config = getConfig()
  return new Promise((resolve, reject) => {
    // 登录
    clg('yellow', '> yapi登录中...')
    // 请求yapi登录接口，获取cookie
    http.post('/api/user/login', {
      email: config.account,
      password: config.password
    }).then(res => {
      if (res.data.errcode === 0) {
        // 获取headers中的set-cookie
        let result = ''
        for (const item of res.headers['set-cookie']) {
          const cookieArr = item.split(';')
          result += `${cookieArr[0]};`
        }
        // 设置请求通用cookie
        setCookie(result)
        clg('yellow', '> yapi登录成功')
        resolve()
      } else {
        clg('yellow', '> yapi登录失败：', res.data.errmsg)
        reject('yapi登录失败: ' + res.data.errmsg)
      }
    }).catch(err => {
      reject(err)
    })
  })
}
