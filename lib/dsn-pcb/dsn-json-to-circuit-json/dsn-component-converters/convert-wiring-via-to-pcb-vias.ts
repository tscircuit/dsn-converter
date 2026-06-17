import type { PcbVia } from "circuit-json"
import Debug from "debug"
import type { Wiring } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertWiringViaToPcbVias")

export const convertWiringViaToPcbVias = ({
  wire,
  transformUmToMm,
  netName,
  pcbViaId,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
  pcbViaId?: string
}): PcbVia[] => {
  if (!wire.path?.coordinates || wire.path.coordinates.length < 2) {
    debug("Couldn't create via")
    return []
  }

  const [x, y] = wire.path.coordinates
  const circuitPoint = applyToPoint(transformUmToMm, { x, y })

  const via: PcbVia = {
    type: "pcb_via",
    layers: ["top", "bottom"],
    pcb_via_id: pcbViaId ?? `pcb_via_${netName}`,
    x: Number(circuitPoint.x.toFixed(4)),
    y: Number(circuitPoint.y.toFixed(4)),
    // TODO look up via size
    outer_diameter: 0.6, // Standard via diameter in mm
    hole_diameter: 0.3, // Standard drill diameter in mm
  }
  debug("Created via", via)

  return [via]
}
