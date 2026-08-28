import type { LayerRef, PcbVia } from "circuit-json"
import type { Padstack } from "../../types"

const DEFAULT_OUTER_DIAMETER_MM = 0.6
const DEFAULT_HOLE_DIAMETER_MM = 0.3

const getViaDiameterFromName = (padstackName?: string) => {
  const match = padstackName?.match(
    /Via\[\d+-\d+\]_(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)_um/,
  )
  if (!match) return {}

  return {
    outerDiameter: Number(match[1]) / 1000,
    holeDiameter: Number(match[2]) / 1000,
  }
}

const getViaDimensions = (padstack?: Padstack) => {
  const nameDimensions = getViaDiameterFromName(padstack?.name)
  const circleShape = padstack?.shapes.find(
    (shape) => shape.shapeType === "circle",
  )

  return {
    outerDiameter:
      circleShape?.diameter !== undefined
        ? circleShape.diameter / 10000
        : (nameDimensions.outerDiameter ?? DEFAULT_OUTER_DIAMETER_MM),
    holeDiameter:
      nameDimensions.holeDiameter ??
      (padstack?.hole?.diameter !== undefined
        ? padstack.hole.diameter / 10000
        : DEFAULT_HOLE_DIAMETER_MM),
  }
}

export const convertViaToPcbVia = ({
  x,
  y,
  netName,
  fromLayer,
  toLayer,
  padstack,
}: {
  x: number
  y: number
  netName: string
  fromLayer: LayerRef
  toLayer: LayerRef
  padstack?: Padstack
}): PcbVia => {
  const { outerDiameter, holeDiameter } = getViaDimensions(padstack)

  return {
    type: "pcb_via",
    pcb_via_id: `pcb_via_${netName}_${x}_${y}`,
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
