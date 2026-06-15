import type { ComponentPlacement } from "lib/dsn-pcb/types"

export type DsnComponentPlace = ComponentPlacement["places"][number]

export function getPlacedPinOffset(
  place: DsnComponentPlace,
  pin: { x: number; y: number },
) {
  const rotationRadians = ((place.rotation ?? 0) * Math.PI) / 180
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)
  const x = place.side === "back" ? -pin.x : pin.x
  const y = pin.y

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

export function getPlacedPinPosition(
  place: DsnComponentPlace,
  pin: { x: number; y: number },
) {
  const offset = getPlacedPinOffset(place, pin)

  return {
    x: (place.x || 0) + offset.x,
    y: (place.y || 0) + offset.y,
  }
}
