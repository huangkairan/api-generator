import fs from 'fs'

// 生成文件夹
export function generateDir (path: string): void {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }
}
