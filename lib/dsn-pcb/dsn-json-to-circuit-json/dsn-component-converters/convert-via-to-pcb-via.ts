import type { LayerRef, PcbVia } from "circuit-json"
import { type Matrix, applyToPoint } from "transformation-matrix"

export const convertViaToPcbVia = ({
  x,
  y,
  netName,
  fromLayer,
  toLayer,
  outerDiameter = 0.6,
  holeDiameter = 0.3,
  index,
}: {
  x: number
  y: number
  netName: string
  fromLayer: LayerRef
  toLayer: LayerRef
  outerDiameter?: number
  holeDiameter?: number
  index?: number
}): PcbVia => {
  return {
    type: "pcb_via",
    pcb_via_id: `pcb_via_${netName}_${x}_${y}${index !== undefined ? `_${index}` : ""}`,
    x,
    y,
    outer_diameter: outerDiameter,
    hole_diameter: holeDiameter,
    layers: [fromLayer, toLayer],
    pcb_trace_id: `pcb_trace_${netName}`,
    from_layer: fromLayer,
    to_layer: toLayer,
  }
}
