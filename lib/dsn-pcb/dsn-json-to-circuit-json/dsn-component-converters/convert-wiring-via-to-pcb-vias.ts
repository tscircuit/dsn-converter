import type { PcbVia } from "circuit-json"
import Debug from "debug"
import type { DsnPcb, Wiring } from "lib/dsn-pcb/types"
import { type Matrix, applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertWiringViaToPcbVias")

export const convertWiringViaToPcbVias = ({
  wire,
  transformUmToMm,
  netName,
  dsnPcb,
}: {
  wire: Wiring["wires"][number]
  transformUmToMm: Matrix
  netName: string
  dsnPcb?: DsnPcb
}): PcbVia[] => {
  if (!wire.path?.coordinates || wire.path.coordinates.length < 2) {
    debug("Couldn't create via")
    return []
  }

  const [x, y] = wire.path.coordinates
  const circuitPoint = applyToPoint(transformUmToMm, { x, y })
  const viaDimensions = getViaDimensions({ wire, dsnPcb, transformUmToMm })

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

function getViaDimensions({
  wire,
  dsnPcb,
  transformUmToMm,
}: {
  wire: Wiring["wires"][number]
  dsnPcb?: DsnPcb
  transformUmToMm: Matrix
}): { outerDiameter: number; holeDiameter: number } {
  const viaName = wire.via_name ?? dsnPcb?.structure.via
  const viaPadstack = dsnPcb?.library.padstacks.find(
    (padstack) => padstack.name === viaName,
  )
  const circleShape = viaPadstack?.shapes.find(
    (shape) => shape.shapeType === "circle",
  )
  const dimensionsFromName = viaName
    ? parseViaDimensionsFromName(viaName)
    : null

  return {
    outerDiameter:
      circleShape?.shapeType === "circle"
        ? Number((circleShape.diameter * transformUmToMm.a).toFixed(4))
        : (dimensionsFromName?.outerDiameter ?? 0.6),
    holeDiameter: viaPadstack?.hole?.diameter
      ? Number((viaPadstack.hole.diameter * transformUmToMm.a).toFixed(4))
      : (dimensionsFromName?.holeDiameter ?? 0.3),
  }
}

function parseViaDimensionsFromName(
  viaName: string,
): { outerDiameter: number; holeDiameter: number } | null {
  const match = viaName.match(/_(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)_um$/)
  if (!match) return null

  return {
    outerDiameter: Number((Number(match[1]) / 1000).toFixed(4)),
    holeDiameter: Number((Number(match[2]) / 1000).toFixed(4)),
  }
}
