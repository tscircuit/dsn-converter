export const computeSegIntersection = (
  seg1: { x1: number; y1: number; x2: number; y2: number },
  seg2: { x1: number; y1: number; x2: number; y2: number },
) => {
  // Get vector components
  const v1x = seg1.x2 - seg1.x1
  const v1y = seg1.y2 - seg1.y1
  const v2x = seg2.x2 - seg2.x1
  const v2y = seg2.y2 - seg2.y1

  // Calculate cross product of vectors
  const cross = v1x * v2y - v1y * v2x

  // Check if lines are parallel (cross product near 0)
  if (Math.abs(cross) < 0.00000001) {
    console.log("lines are parallel")
    return null
  }

  // Calculate intersection point using parametric form
  const t = ((seg2.x1 - seg1.x1) * v2y - (seg2.y1 - seg1.y1) * v2x) / cross

  // Check if intersection point lies within both line segments
  // if (t < 0 || t > 1) {
  //   console.log("t is out of bounds")
  //   return null
  // }

  const s = ((seg2.x1 - seg1.x1) * v1y - (seg2.y1 - seg1.y1) * v1x) / cross
  // if (s < 0 || s > 1) {
  //   console.log("s is out of bounds")
  //   return null
  // }

  // Calculate intersection point
  return {
    x: seg1.x1 + t * v1x,
    y: seg1.y1 + t * v1y,
  }
}
