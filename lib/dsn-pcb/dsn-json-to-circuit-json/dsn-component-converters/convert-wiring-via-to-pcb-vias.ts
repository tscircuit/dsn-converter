import type { PcbVia } from "circuit-json"
import Debug from "debug"
import type { Wiring } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertWiringViaToPcbVias")

const getViaDiametersFromName = (viaName?: string) => {
  const match = viaName?.match(/_([0-9.]+):([0-9.]+)_um(?:$|[^0-9])/)
  if (!match) {
    return {
      outerDiameter: 0.6,
      holeDiameter: 0.3,
    }
  }

  return {
    outerDiameter: Number(match[1]) / 1000,
    holeDiameter: Number(match[2]) / 1000,
  }
}

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
  const roundedX = Number(circuitPoint.x.toFixed(4))
  const roundedY = Number(circuitPoint.y.toFixed(4))
  const { outerDiameter, holeDiameter } = getViaDiametersFromName(wire.via_name)
  const sanitizedNetName = netName.replace(/[^a-zA-Z0-9_-]/g, "_")

  const via: PcbVia = {
    type: "pcb_via",
    layers: ["top", "bottom"],
    pcb_via_id: `pcb_via_${sanitizedNetName}_${roundedX}_${roundedY}`,
    x: roundedX,
    y: roundedY,
    outer_diameter: outerDiameter,
    hole_diameter: holeDiameter,
    pcb_trace_id: `pcb_trace_${netName}`,
  }
  debug("Created via", via)

  return [via]
}
