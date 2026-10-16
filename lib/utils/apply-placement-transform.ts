/**
 * Placement transform helpers for DSN -> Circuit JSON conversion.
 *
 * DSN (Specctra) placement semantics: a point local to a footprint image is
 * mirrored about the Y axis when the component is placed on the back side,
 * then rotated counter-clockwise by the placement rotation (degrees, in the
 * y-up DSN coordinate space), then translated to the placement origin.
 * Converters that ignore this place every rotated/back-side component's
 * pads, ports and keepouts at unrotated, unmirrored positions.
 */

import type { LayerRef } from "circuit-json"

export interface DsnPlaceLike {
  x?: number | null
  y?: number | null
  side?: string
  rotation?: number
}

function snapTrig(value: number): number {
  if (Math.abs(value) < 1e-12) return 0
  if (Math.abs(Math.abs(value) - 1) < 1e-12) return Math.sign(value)
  return value
}

export function rotatePoint(
  point: { x: number; y: number },
  rotationDeg: number,
): { x: number; y: number } {
  if (!rotationDeg) return { x: point.x, y: point.y }
  const rad = (rotationDeg * Math.PI) / 180
  const cos = snapTrig(Math.cos(rad))
  const sin = snapTrig(Math.sin(rad))
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

/**
 * Transform a footprint-local point (pin offset, keepout center, polygon
 * vertex) into absolute DSN board coordinates for a given placement.
 */
export function transformLocalPointToBoard(
  place: DsnPlaceLike,
  local: { x: number; y: number },
): { x: number; y: number } {
  const mirrored =
    place.side === "back" ? { x: -local.x, y: local.y } : { ...local }
  const rotated = rotatePoint(mirrored, place.rotation ?? 0)
  return {
    x: (place.x ?? 0) + rotated.x,
    y: (place.y ?? 0) + rotated.y,
  }
}

export function normalizeRotation(rotationDeg: number): number {
  const normalized = rotationDeg % 360
  return normalized < 0 ? normalized + 360 : normalized
}

/** Total orientation of a pad: pin-level (rotate N) plus placement rotation. */
export function getTotalPadRotation(
  place: DsnPlaceLike,
  pinRotation?: number,
): number {
  return normalizeRotation((place.rotation ?? 0) + (pinRotation ?? 0))
}

/**
 * Map DSN structure layer names to Circuit JSON layer refs by stack position:
 * first layer -> "top", last -> "bottom", inner layers -> "inner1", "inner2",
 * ... in stack order.
 */
/**
 * Circuit JSON layer ref for a stack position: first layer is the top,
 * last is the bottom, everything between is an inner layer numbered by
 * its position.
 */
export function circuitLayerForStackPosition(
  position: number,
  layerCount: number,
): LayerRef {
  if (position === 0) return "top"
  if (position === layerCount - 1) return "bottom"
  // The template always yields "inner<position>"; the cast covers DSN
  // stacks deeper than circuit JSON's six named inner layers, whose
  // positional names have no member in the LayerRef union
  return `inner${position}` as LayerRef
}

export function buildDsnLayerToCircuitLayerMap(
  layers: Array<{ name: string; property?: { index?: number } }>,
): Map<string, LayerRef> {
  // Sort by the declared stack index; layers without one (some exporters
  // omit the (property (index N)) group) keep their declaration order
  const sorted = layers
    .map((layer, declarationIndex) => ({ layer, declarationIndex }))
    .sort(
      (a, b) =>
        (a.layer.property?.index ?? a.declarationIndex) -
        (b.layer.property?.index ?? b.declarationIndex),
    )
    .map(({ layer }) => layer)
  const map = new Map<string, LayerRef>()
  sorted.forEach((layer, position) => {
    // position is the stack position after sorting
    map.set(layer.name, circuitLayerForStackPosition(position, sorted.length))
  })
  return map
}

export function flipCircuitLayer(layer: LayerRef): LayerRef {
  if (layer === "top") return "bottom"
  if (layer === "bottom") return "top"
  return layer
}
