import { format as prettify } from 'prettier'

// 格式化代码
export function formatCode (code: string): string {
  return prettify(code, { parser: 'typescript' })
}
