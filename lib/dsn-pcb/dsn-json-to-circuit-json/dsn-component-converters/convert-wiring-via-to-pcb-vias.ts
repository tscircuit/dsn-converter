import type { PcbVia } from "circuit-json"
import Debug from "debug"
import type { Padstack, Wiring } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertWiringViaToPcbVias")

export const convertWiringViaToPcbVias = ({
  wire,
  transformUmToMm,
  netName,
  viaPadstack,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
  viaPadstack?: Padstack
}): PcbVia[] => {
  if (!wire.path?.coordinates || wire.path.coordinates.length < 2) {
    debug("Couldn't create via")
    return []
  }

  const [x, y] = wire.path.coordinates
  const circuitPoint = applyToPoint(transformUmToMm, { x, y })

  const viaDimensions = getViaDimensionsFromPadstack(viaPadstack)
  const via: PcbVia = {
    type: "pcb_via",
    layers: ["top", "bottom"],
    pcb_via_id: `pcb_via_${netName}`,
    x: Number(circuitPoint.x.toFixed(4)),
    y: Number(circuitPoint.y.toFixed(4)),
    outer_diameter: viaDimensions.outerDiameter,
    hole_diameter: viaDimensions.holeDiameter,
  }
  debug("Created via", via)

  return [via]
}

const getViaDimensionsFromPadstack = (padstack?: Padstack) => {
  const outerDiameterUm = Math.max(
    0,
    ...(padstack?.shapes ?? [])
      .filter((shape) => shape.shapeType === "circle")
      .map((shape) => shape.diameter ?? 0),
  )
  const holeDiameterUm =
    padstack?.hole?.diameter ??
    padstack?.hole?.width ??
    extractHoleDiameterFromPadstackName(padstack?.name)

  return {
    outerDiameter: Number(((outerDiameterUm || 600) / 1000).toFixed(4)),
    holeDiameter: Number(((holeDiameterUm || 300) / 1000).toFixed(4)),
  }
}

const extractHoleDiameterFromPadstackName = (name?: string) => {
  if (!name) return undefined
  const match = name.match(/_(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)_um$/)
  return match ? Number(match[2]) : undefined
}
