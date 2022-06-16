import fs from 'fs'
import Nedb from 'nedb'
import path from 'path'
import { getCacheList } from '../generate/diff'
import { IApiCache, IApiInfoList } from '../typing/yapi'
import { getConfig } from './config'

/**
 * @description 获取数据库客户端
 */
function getDBClient (): Promise<Nedb> {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(__dirname, './data')
    const fileName = path.join(filePath, '/save.db')
    // 判断路径是否存在，不存在则创建
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath)
    }
    // 新建db客户端
    const db = new Nedb({
      filename: fileName
    })
    db.loadDatabase((err) => {
      if (err) reject(err)
      else resolve(db)
    })
  })
}

/**
 * @description 更新数据库
 */
export async function updateDB (data: IApiInfoList[], projectName: string, projectId: number): Promise<void> {
  // 拼装需要更新的缓存数据
  const apiList = getCacheList(data, projectName, projectId)
  const modularIds = apiList.map(e => e.modularId)
  return new Promise(async (resolve, reject) => {
    try {
      // 获取DB客户端
      const db = await getDBClient()
      const caches = await getDBCache({
        modularId: {
          $in: modularIds
        }
      })
      // 新增数据
      const insertList: IApiCache[] = apiList.filter(e => !caches.some(c => c.modularId === e.modularId))
      // 修改数据
      const updateList: IApiCache[] = apiList.filter(e => caches.some(c => c.modularId === e.modularId))
      // 如果有新增的数据
      if (insertList.length > 0) {
        db.insert(insertList, (err) => {
          if (err) reject(`nedb 添加失败: ${err}`)
        })
      }
      // 如果有新增的数据
      for (const item of updateList) {
        db.update({ modularId: item.modularId },
          { $set: { ...item } },
          {},
          (err) => {
            if (err) reject(`nedb 更新失败: ${err}`)
          })
      }
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * @description 获取当前项目DB中的缓存数据
 */
export async function getDBCache (where: { [key: string]: any } = {}): Promise<IApiCache[]> {
  return new Promise(async (resolve, reject) => {
    const db = await getDBClient()
    try {
      db.find({
        cwd: process.cwd(),
        ...where
      }).exec((err, ret: IApiCache[]) => {
        if (err) {
          reject(err)
        }
        const config = getConfig()
        // 判断本地文件是否存在，不存在则删除该缓存
        const existFiles = ret.filter(e => fs.existsSync(path.resolve(`${config.outDir}/${e.projectName}`)))
        const deleteModularIds = ret.filter(e => !existFiles.some(c => c.modularId === e.modularId)).map(e => e.modularId)
        db.remove({
          modularId: {
            $in: deleteModularIds
          },
          cwd: process.cwd()
        })
        resolve(existFiles)
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * @description 移除缓存
 */
export async function removeDBCache (): Promise<number> {
  return new Promise(async (resolve, reject) => {
    const db = await getDBClient()
    db.remove({ cwd: process.cwd() }, {},
      (err, ret: number) => {
        if (err) {
          reject(err)
        }
        resolve(ret)
      })
  })
}
