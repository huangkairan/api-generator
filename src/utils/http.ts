import axios from 'axios'
import { getConfig } from './config'

/**
 * @description 初始化请求default
 */
export function initAxios (): void {
  const config = getConfig()
  axios.defaults.baseURL = config.originUrl
}

/**
 * @description 设置cookie
 */
export function setCookie (cookie: string): void {
  axios.interceptors.request.use((req) => {
    req.headers = {
      ...req.headers,
      cookie: cookie
    }
    return req
  })
}

export const http = axios
