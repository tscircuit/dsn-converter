import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "../../types"
import { type Matrix, applyToPoint } from "transformation-matrix"
import { pairs } from "lib/utils/pairs"

export function convertPlanesToCopperPours(
  dsnPcb: DsnPcb,
  transform: Matrix,
): AnyCircuitElement[] {
  const result: AnyCircuitElement[] = []

  if (!dsnPcb.structure.planes) return result

  for (let i = 0; i < dsnPcb.structure.planes.length; i++) {
    const plane = dsnPcb.structure.planes[i]
    const poly = plane.polygon
    
    const points = pairs(poly.coordinates).map(([x, y]) => {
      const p = applyToPoint(transform, { x, y })
      return { x: p.x, y: p.y }
    })

    result.push({
      type: "pcb_copper_pour",
      pcb_copper_pour_id: `pcb_copper_pour_${plane.net}_${i}`,
      layer: poly.layer === "Route2" ? "inner1" : "top", // TODO map layers correctly
      points,
    } as any)
  }

  return result
}
