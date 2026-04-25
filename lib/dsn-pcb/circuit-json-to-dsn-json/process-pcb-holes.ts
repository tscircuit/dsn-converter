import type { AnyCircuitElement } from "circuit-json"
import { scale } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { DsnPcb } from "../types"

const transformMmToUm = scale(1000)

/**
 * Processes `pcb_hole` elements (non-plated through holes) from circuit JSON
 * and adds them to the DSN PCB as standalone mechanical components.
 *
 * Unlike `pcb_plated_hole`, a `pcb_hole` has no copper ring — it is a drill-only
 * hole used for mounting, alignment, or mechanical purposes. In the DSN format
 * these are represented with a padstack that has a copper shape equal to the
 * drill diameter (so the router will leave clearance around the hole) and
 * `(attach off)` to indicate no net connection.
 */
export function processPcbHoles(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
): void {
  const pcbHoles = circuitElements.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_hole" }> =>
      el.type === "pcb_hole",
  )

  if (pcbHoles.length === 0) return

  const processedPadstacks = new Set<string>(
    pcb.library.padstacks.map((p) => p.name),
  )

  for (const hole of pcbHoles) {
    if (hole.hole_shape !== "circle") {
      // Only circle holes are supported in this pass; rect holes can be added later
      continue
    }

    const holeDiameterUm = Math.round(hole.hole_diameter * 1000)
    const padstackName = `NPTH_${holeDiameterUm}`

    // Add the padstack once per unique diameter
    if (!processedPadstacks.has(padstackName)) {
      pcb.library.padstacks.push({
        name: padstackName,
        // Use a circle on B.Cu matching the drill diameter so routers
        // know to keep clearance around the hole.
        shapes: [
          {
            shapeType: "circle" as const,
            layer: "B.Cu",
            diameter: holeDiameterUm,
          },
        ],
        attach: "off",
      })
      processedPadstacks.add(padstackName)
    }

    const holeId =
      (hole as any).pcb_hole_id ?? `hole_${pcbHoles.indexOf(hole)}`
    const imageName = `NPTH_${holeDiameterUm}_mm`

    // Add a library image for this hole type if not already present
    let image = pcb.library.images.find((img) => img.name === imageName)
    if (!image) {
      image = { name: imageName, outlines: [], pins: [] }
      pcb.library.images.push(image)
    }

    // Add a pin at the origin (the placement coordinates carry the position)
    const alreadyHasPin = image.pins.some(
      (p) => p.x === 0 && p.y === 0 && p.padstack_name === padstackName,
    )
    if (!alreadyHasPin) {
      image.pins.push({
        padstack_name: padstackName,
        pin_number: 1,
        x: 0,
        y: 0,
      })
    }

    // Place the component
    const posUm = applyToPoint(transformMmToUm, { x: hole.x, y: -hole.y })

    // Find or create the placement component entry for this image
    let component = pcb.placement.components.find(
      (c) => c.name === imageName,
    )
    if (!component) {
      component = { name: imageName, places: [] }
      pcb.placement.components.push(component)
    }

    component.places.push({
      refdes: `H_${holeId}`,
      x: Math.round(posUm.x),
      y: Math.round(posUm.y),
      side: "front" as const,
      rotation: 0,
      PN: `NPTH_${hole.hole_diameter}mm`,
    })
  }
}
