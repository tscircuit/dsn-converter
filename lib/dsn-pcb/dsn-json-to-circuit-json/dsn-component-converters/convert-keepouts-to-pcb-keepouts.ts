import type { AnyCircuitElement } from "circuit-json"
import Debug from "debug"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { applyToPoint } from "transformation-matrix"

const debug = Debug("dsn-converter:convertKeepoutsToPcbKeepouts")

// Maps DSN layer names to circuit-json layer names using the board's
// structure layer order (first = top, last = bottom, middle = innerN),
// with common aliases as fallback.
function buildLayerNameMap(pcb: DsnPcb): Map<string, string> {
  const map = new Map<string, string>()
  const rawLayers: any[] = (pcb.structure as any)?.layers ?? []
  const layerNames = rawLayers
    .map((l) => (typeof l === "string" ? l : l?.name))
    .filter((n): n is string => typeof n === "string")

  if (layerNames.length >= 2) {
    layerNames.forEach((name, i) => {
      if (i === 0) map.set(name, "top")
      else if (i === layerNames.length - 1) map.set(name, "bottom")
      else map.set(name, `inner${i}`)
    })
  }
  for (const n of ["F.Cu", "F_Cu", "Top"]) if (!map.has(n)) map.set(n, "top")
  for (const n of ["B.Cu", "B_Cu", "Bottom"])
    if (!map.has(n)) map.set(n, "bottom")
  return map
}

export function convertKeepoutsToPcbKeepouts(
  pcb: DsnPcb,
  dsnToCircuitJsonTransform: any,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const { images } = pcb.library
  const layerNameMap = buildLayerNameMap(pcb)

  debug("processing keepouts...")
  images.forEach((image) => {
    if (!image.keepouts?.length) return

    const componentId = image.name
    const placementComponent = pcb.placement.components.find(
      (comp) => comp.name === componentId,
    )

    if (!placementComponent) {
      console.warn(`No placement component found for image: ${componentId}`)
      return
    }

    placementComponent.places.forEach((place) => {
      const { x: compX, y: compY } = place

      image.keepouts!.forEach((keepout, keepoutIndex) => {
        const layer = layerNameMap.get(keepout.layer)
        if (!layer) {
          console.warn(`Unknown keepout layer: ${keepout.layer}`)
          return
        }

        const { x: circuitX, y: circuitY } = applyToPoint(
          dsnToCircuitJsonTransform,
          {
            x: (compX || 0) + keepout.x,
            y: (compY || 0) + keepout.y,
          },
        )

        elements.push({
          type: "pcb_keepout",
          pcb_keepout_id: `pcb_keepout_${componentId}_${place.refdes}_${keepoutIndex}`,
          shape: "circle",
          center: { x: circuitX, y: circuitY },
          radius: keepout.diameter / 1000 / 2,
          layers: [layer],
        } as AnyCircuitElement)
      })
    })
  })

  return elements
}
