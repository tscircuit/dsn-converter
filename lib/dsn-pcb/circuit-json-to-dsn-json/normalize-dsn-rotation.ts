export function normalizeDsnRotation(rotation: number | undefined): number {
  const normalized = (rotation ?? 0) % 360
  return normalized < 0 ? normalized + 360 : normalized
}
