export const rotatePoint = (
  x: number,
  y: number,
  degrees: number,
): { x: number; y: number } => {
  if (degrees === 0) return { x, y }
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}
