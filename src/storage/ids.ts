// Gerador de id simples (sem dependência externa).
export function nanoid(size = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  const arr = new Uint8Array(size)
  crypto.getRandomValues(arr)
  for (let i = 0; i < size; i++) out += chars[arr[i] % chars.length]
  return out
}