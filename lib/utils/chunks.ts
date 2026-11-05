export const chunks = <T>(array: T[], size: number): T[][] => {
  if (!Number.isFinite(size) || size <= 0) return []
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}
