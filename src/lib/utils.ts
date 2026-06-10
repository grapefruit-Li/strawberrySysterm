/** CSS类名合并工具函数 */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}
