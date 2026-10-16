import type { AnyCircuitElement, PCBKeepout } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import type { DsnPcb } from "lib/dsn-pcb/types"
import {
  buildDsnLayerToCircuitLayerMap,
  flipCircuitLayer,
  transformLocalPointToBoard,
} from "lib/utils/apply-placement-transform"

/**
 * Convert footprint-level (image) keepouts from the DSN library into
 * pcb_keepout elements, one per placed component instance. Positions go
 * through the same placement transform as pads (mirror on back side,
 * placement rotation), and DSN layer names are mapped to Circuit JSON
 * layer refs by stack position.
 */
export function convertImageKeepoutsToPcbKeepouts(
  pcb: DsnPcb,
  dsnToCircuitJsonTransform: any,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const layerMap = buildDsnLayerToCircuitLayerMap(pcb.structure.layers)

  for (const image of pcb.library.images) {
    if (!image.keepouts || image.keepouts.length === 0) continue

    const placementComponent = pcb.placement.components.find(
      (comp) => comp.name === image.name,
    )
    if (!placementComponent) continue

    for (const place of placementComponent.places) {
      image.keepouts.forEach((keepout, keepoutIndex) => {
        const boardPoint = transformLocalPointToBoard(place, keepout)
        const center = applyToPoint(dsnToCircuitJsonTransform, boardPoint)

        let layer = layerMap.get(keepout.layer) ?? "top"
        if (place.side === "back") {
          layer = flipCircuitLayer(layer)
        }

        const pcbKeepout: PCBKeepout = {
          type: "pcb_keepout",
          shape: "circle",
          pcb_keepout_id: `pcb_keepout_${image.name}_${place.refdes}_${keepoutIndex}`,
          center,
          radius: keepout.diameter / 2 / 1000,
          layers: [layer],
        }
        elements.push(pcbKeepout)
      })
    }
  }

  return elements
}
