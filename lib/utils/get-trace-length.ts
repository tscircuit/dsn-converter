export function getTraceLength(points: Array<{ x: number; y: number }>): number {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy)
  }
  return Number(length.toFixed(4))
}
