import { compile } from 'json-schema-to-typescript'

// json schema生成声明文件
export async function jsonSchemaToDts (jsonSchema: any, name: string): Promise<string> {
  // 防止导出的对象重名，对子对象进行重命名
  recursionRename(jsonSchema.properties, name)
  return new Promise((resolve) => {
    jsonSchema.title = name
    compile(jsonSchema, name, {
      unknownAny: false,
      bannerComment: '',
      ignoreMinAndMaxItems: true,
      unreachableDefinitions: true
    }).then(dts => {
      resolve(dts)
    }).catch(err => {
      throw new Error(`json schema转声明文件失败：${err.toString()}`)
    })
  })
}

/**
 * @description 递归json schema修改名字
 */
function recursionRename (schema: any, prefix: string) {
  for (const key in schema) {
    const item = schema[key]
    const keyName = key[0].toLocaleUpperCase() + key.substring(1, key.length)
    // 如果是对象则重命名
    if (item.properties && item.type === 'object') {
      item.title = `${prefix}${keyName}`
      item.$$ref = `#/definitions/${prefix}${keyName}`
    }
    if (item.properties) {
      recursionRename(item.properties, `${prefix}${keyName}`)
    }
    // 如果是对象数组则重命名并递归下去
    if (item.items && item.items.type === 'object') {
      item.items.title = `${prefix}${keyName}`
      item.items.$$ref = `#/definitions/${prefix}${keyName}`
      recursionRename(item.items, `${prefix}${keyName}`)
    }
  }
}
