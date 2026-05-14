export function rotatePoint(
  point: { x: number; y: number },
  rotationDegrees = 0,
): { x: number; y: number } {
  const radians = (rotationDegrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

export function isQuarterTurn(rotationDegrees = 0): boolean {
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360
  return normalizedRotation === 90 || normalizedRotation === 270
}
