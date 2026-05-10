export function parseViaSize(
  viaName: string,
): { outerDiameter: number; holeDiameter: number } | null {
  // Common format: Via[0-3]_800:400_um or Via[0-1]_600:300_um
  const match = viaName.match(/(\d+):(\d+)_(\w+)/)
  if (!match) return null

  const [, outer, hole, unit] = match
  let scale = 1
  if (unit === "um") scale = 1 / 1000
  else if (unit === "mm") scale = 1
  else if (unit === "mil") scale = 0.0254

  return {
    outerDiameter: Number.parseInt(outer, 10) * scale,
    holeDiameter: Number.parseInt(hole, 10) * scale,
  }
}
