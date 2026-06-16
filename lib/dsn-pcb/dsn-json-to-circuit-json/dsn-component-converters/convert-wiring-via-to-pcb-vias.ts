import type { PcbVia } from "circuit-json"
import Debug from "debug"
import type { Wiring } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertWiringViaToPcbVias")

export const convertWiringViaToPcbVias = ({
  wire,
  transformUmToMm,
  netName,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
}): PcbVia[] => {
  if (!wire.path?.coordinates || wire.path.coordinates.length < 2) {
    debug("Couldn't create via")
    return []
  }

  const [x, y] = wire.path.coordinates
  const circuitPoint = applyToPoint(transformUmToMm, { x, y })

  const xMm = Number(circuitPoint.x.toFixed(4))
  const yMm = Number(circuitPoint.y.toFixed(4))

  const via: PcbVia = {
    type: "pcb_via",
    layers: ["top", "bottom"],
    pcb_via_id: `pcb_via_${netName}_${xMm}_${yMm}`,
    pcb_trace_id: `pcb_trace_${netName}`,
    x: xMm,
    y: yMm,
    // TODO look up via size
    outer_diameter: 0.6, // Standard via diameter in mm
    hole_diameter: 0.3, // Standard drill diameter in mm
  }
  debug("Created via", via)

  return [via]
}
