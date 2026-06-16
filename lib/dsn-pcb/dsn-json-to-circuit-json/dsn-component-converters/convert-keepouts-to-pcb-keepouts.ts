import type { AnyCircuitElement } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { DsnPcb } from "../../types"

const sanitizeIdPart = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, "_") || "unnamed"

const getCircuitJsonLayer = (dsnPcb: DsnPcb, layer: string) => {
  const normalizedLayer = layer.toLowerCase()
  if (normalizedLayer === "top" || normalizedLayer === "f.cu") return "top"
  if (normalizedLayer === "bottom" || normalizedLayer === "b.cu")
    return "bottom"

  const layerDefinition = dsnPcb.structure.layers.find((l) => l.name === layer)
  const layerIndex = layerDefinition?.property?.index
  if (layerIndex === undefined) return layer

  const maxLayerIndex = Math.max(
    ...dsnPcb.structure.layers.map((l) => l.property.index),
  )
  if (layerIndex === 0) return "top"
  if (layerIndex === maxLayerIndex) return "bottom"
  return `inner${layerIndex}`
}

export function convertKeepoutsToPcbKeepouts(
  dsnPcb: DsnPcb,
  transformDsnUnitToMm: Matrix,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []

  for (const image of dsnPcb.library.images) {
    if (!image.keepouts?.length) continue

    const placementComponent = dsnPcb.placement.components.find(
      (comp) => comp.name === image.name,
    )
    if (!placementComponent) continue

    for (const place of placementComponent.places) {
      image.keepouts.forEach((keepout, keepoutIndex) => {
        const { shape } = keepout
        const center = applyToPoint(transformDsnUnitToMm, {
          x: (place.x || 0) + shape.x,
          y: (place.y || 0) + shape.y,
        })

        elements.push({
          type: "pcb_keepout",
          pcb_keepout_id: `pcb_keepout_${sanitizeIdPart(image.name)}_${sanitizeIdPart(place.refdes)}_${keepoutIndex}`,
          shape: "circle",
          center,
          radius: shape.diameter / 2 / 1000,
          layers: [getCircuitJsonLayer(dsnPcb, shape.layer)],
          description: keepout.name || undefined,
        } as AnyCircuitElement)
      })
    }
  }

  return elements
}
