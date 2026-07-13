export interface PlacementLike {
  x?: number
  y?: number
  side?: string
  rotation?: number
}

/**
 * Returns the pin offset rotated by the component placement rotation.
 * DSN placement rotation is in degrees counter-clockwise. Back-side
 * placements are mirrored about the component's local Y axis (per the
 * Specctra DSN convention), which also reverses the rotation direction.
 */
export const rotatePinOffset = (
  pin: { x: number; y: number },
  place: PlacementLike,
): { x: number; y: number } => {
  const px = place.side === "back" ? -pin.x : pin.x
  const py = pin.y
  const theta = ((place.rotation || 0) * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return {
    x: px * cos - py * sin,
    y: px * sin + py * cos,
  }
}

/**
 * Absolute position of a pin on the board (still in DSN units), i.e. the
 * placement position plus the rotated pin offset.
 */
export const getPinPositionWithPlacement = (
  pin: { x: number; y: number },
  place: PlacementLike,
): { x: number; y: number } => {
  const offset = rotatePinOffset(pin, place)
  return {
    x: (place.x || 0) + offset.x,
    y: (place.y || 0) + offset.y,
  }
}

/**
 * Total rotation (degrees CCW) of a pad belonging to a pin, combining the
 * placement rotation and the optional per-pin `(rotate ...)` clause.
 * Back-side placements mirror the geometry, which negates the angle.
 */
export const getEffectivePadRotation = (
  place: PlacementLike,
  pinRotation?: number,
): number => {
  const total = (place.rotation || 0) + (pinRotation || 0)
  const effective = place.side === "back" ? -total : total
  return ((effective % 360) + 360) % 360
}
