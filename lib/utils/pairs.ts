export const pairs = <T>(array: T[]): [T, T | undefined][] => {
  const result: [T, T | undefined][] = []
  for (let i = 0; i < array.length; i += 2) {
    result.push([array[i], array[i + 1]])
  }
  return result
}
