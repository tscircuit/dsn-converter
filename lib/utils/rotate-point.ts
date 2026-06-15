export function rotatePoint(
  x: number,
  y: number,
  rotationDegrees: number,
): { x: number; y: number } {
  const rotationRadians = (rotationDegrees * Math.PI) / 180
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}
