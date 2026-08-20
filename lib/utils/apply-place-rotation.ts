/**
 * DSN `(place ...)` entries carry a rotation in degrees that applies to the
 * footprint's pin offsets around the placement origin. Back-side placements are
 * additionally mirrored across the x axis, matching how KiCad flips footprints.
 */
export function applyPlaceRotation(
  pinOffset: { x: number; y: number },
  rotationDegrees: number | undefined,
  side?: string,
): { x: number; y: number } {
  const x = side === "back" ? -pinOffset.x : pinOffset.x
  const { y } = pinOffset

  const rotation = ((rotationDegrees ?? 0) % 360) * (Math.PI / 180)
  if (rotation === 0) return { x, y }

  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}
