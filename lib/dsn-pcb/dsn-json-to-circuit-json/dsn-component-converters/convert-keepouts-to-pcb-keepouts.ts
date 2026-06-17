import type { AnyCircuitElement, PCBKeepoutCircle } from "circuit-json"
import Debug from "debug"
import type { DsnPcb, Structure } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

// Front/back copper layer name sets (KiCad + Freerouting/other)
const FRONT_COPPER = new Set(["F.Cu", "Top", "F_Cu"])
const BACK_COPPER = new Set(["B.Cu", "Bottom", "B_Cu"])

const debug = Debug("dsn-converter:convertKeepoutsToPcbKeepouts")

export function mapDsnLayerToCircuitLayer(
  layerName: string,
  structure: Structure,
): string {
  if (FRONT_COPPER.has(layerName)) return "top"
  if (BACK_COPPER.has(layerName)) return "bottom"
  const index = structure.layers.findIndex((l) => l.name === layerName)
  if (index >= 0) return `inner${index}`
  return layerName
}

export function convertKeepoutsToPcbKeepouts(
  pcb: DsnPcb,
  dsnToCircuitJsonTransform: any,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const { images } = pcb.library

  images.forEach((image) => {
    if (!image.keepouts || image.keepouts.length === 0) return

    const placementComponent = pcb.placement.components.find(
      (comp) => comp.name === image.name,
    )
    if (!placementComponent) {
      console.warn(`No placement component for keepout image: ${image.name}`)
      return
    }

    placementComponent.places.forEach((place) => {
      image.keepouts!.forEach((keepout, i) => {
        if (keepout.shape !== "circle") {
          debug("Unsupported keepout shape:", keepout.shape)
          return
        }
        const center = applyToPoint(dsnToCircuitJsonTransform, {
          x: (place.x || 0) + keepout.x,
          y: (place.y || 0) + keepout.y,
        })
        const pcbKeepout: PCBKeepoutCircle = {
          type: "pcb_keepout",
          pcb_keepout_id: `pcb_keepout_${image.name}_${place.refdes}_${i}`,
          shape: "circle",
          center,
          radius: keepout.diameter / 2 / 1000,
          layers: [mapDsnLayerToCircuitLayer(keepout.layer, pcb.structure)],
        }
        elements.push(pcbKeepout)
      })
    })
  })

  return elements
}
