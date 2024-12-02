import type { PcbVia } from "circuit-json"
import { type Matrix, applyToPoint } from "transformation-matrix"

export const convertViaToPcbVia = ({
  x,
  y,
  netName,
}: {
  x: number
  y: number
  netName: string
}): PcbVia => {
  return {
    type: "pcb_via",
    pcb_via_id: `pcb_via_${netName}_${x}_${y}`,
    x,
    y,
    outer_diameter: 0.6, // From session file "Via[0-1]_600:300_um"
    hole_diameter: 0.3, // From session file "Via[0-1]_600:300_um"
    layers: ["top", "bottom"],
    pcb_trace_id: `pcb_trace_${netName}`,
  }
}
