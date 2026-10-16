import type { AnyCircuitElement, PcbCopperPourPolygon } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { buildDsnLayerToCircuitLayerMap } from "lib/utils/apply-placement-transform"
import { pairs } from "lib/utils/pairs"

/**
 * Convert DSN structure planes (e.g. `(plane AGND (polygon Route2 0 ...))`)
 * into pcb_copper_pour elements connected to their source net. Plane
 * (window ...) clearance cutouts are not modelled yet, so a pour may cover
 * areas a window would have cleared.
 */
export function convertStructurePlanesToCopperPours(
  pcb: DsnPcb,
  dsnToCircuitJsonTransform: any,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const planes = pcb.structure.planes ?? []
  if (planes.length === 0) return elements

  const layerMap = buildDsnLayerToCircuitLayerMap(pcb.structure.layers)

  planes.forEach((plane, planeIndex) => {
    plane.polygons.forEach((polygon, polygonIndex) => {
      const rawPoints = pairs(polygon.coordinates).map(([x, y]) => ({ x, y }))
      // DSN polygons repeat the first point at the end to close the loop
      const first = rawPoints[0]
      const last = rawPoints[rawPoints.length - 1]
      if (first && last && first.x === last.x && first.y === last.y) {
        rawPoints.pop()
      }

      const pour: PcbCopperPourPolygon = {
        type: "pcb_copper_pour",
        shape: "polygon",
        pcb_copper_pour_id: `pcb_copper_pour_${plane.net_name}_${planeIndex}_${polygonIndex}`,
        layer: layerMap.get(polygon.layer) ?? "top",
        points: rawPoints.map((point) =>
          applyToPoint(dsnToCircuitJsonTransform, point),
        ),
        covered_with_solder_mask: false,
        source_net_id: `source_net_${plane.net_name}`,
      }
      elements.push(pour)
    })
  })

  return elements
}
