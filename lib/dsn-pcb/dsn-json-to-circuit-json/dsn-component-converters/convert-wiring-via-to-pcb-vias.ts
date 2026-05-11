import type { PcbVia } from "circuit-json"
import Debug from "debug"
import type { Padstack, Wiring } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"
import { getViaDimensions } from "./get-via-dimensions"

const debug = Debug("dsn-converter:convertWiringViaToPcbVias")

export const convertWiringViaToPcbVias = ({
  wire,
  transformUmToMm,
  netName,
  padstacks = [],
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
  padstacks?: Padstack[]
}): PcbVia[] => {
  if (!wire.path?.coordinates || wire.path.coordinates.length < 2) {
    debug("Couldn't create via")
    return []
  }

  const [x, y] = wire.path.coordinates
  const circuitPoint = applyToPoint(transformUmToMm, { x, y })
  const viaPadstack = padstacks.find((p) => p.name === wire.padstack_name)
  const { outerDiameter, holeDiameter } = getViaDimensions(viaPadstack)

  const via: PcbVia = {
    type: "pcb_via",
    layers: ["top", "bottom"],
    pcb_via_id: `pcb_via_${netName}`,
    x: Number(circuitPoint.x.toFixed(4)),
    y: Number(circuitPoint.y.toFixed(4)),
    outer_diameter: outerDiameter,
    hole_diameter: holeDiameter,
  }
  debug("Created via", via)

  return [via]
}
