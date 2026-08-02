import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, Padstack } from "../types"

// An NPTH padstack has no copper shapes — it is a mechanical drill only.
function createNpthPadstack(name: string): Padstack {
  return {
    name,
    shapes: [],
    attach: "off",
  }
}

/**
 * Converts pcb_hole (unplated / NPTH) elements to DSN placement entries.
 *
 * Each unique hole diameter gets its own padstack image. Each hole instance
 * becomes a component placement so that the Freerouting autorouter knows to
 * avoid routing copper through that mechanical hole.
 */
export function processUnplatedHoles(
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
): void {
  const holes = circuitElements.filter((e) => e.type === "pcb_hole") as Array<{
    type: "pcb_hole"
    pcb_hole_id: string
    hole_shape: string
    hole_diameter: number
    x: number
    y: number
  }>
  if (holes.length === 0) return

  const processedPadstacks = new Set<string>()
  let holeIndex = 1

  for (const hole of holes) {
    // Only circle shape is supported for now; oval/rect would need further extension
    if (hole.hole_shape !== "circle") continue

    const diameterUm = Math.round(hole.hole_diameter * 1000)
    const padstackName = `NPTH_${diameterUm}`

    // Register the padstack exactly once
    if (!processedPadstacks.has(padstackName)) {
      pcb.library.padstacks.push(createNpthPadstack(padstackName))
      processedPadstacks.add(padstackName)
    }

    // Each hole instance becomes its own image + placement so it appears in
    // the DSN with its actual board coordinates (in μm).
    const imageName = padstackName
    if (!pcb.library.images.find((img) => img.name === imageName)) {
      pcb.library.images.push({
        name: imageName,
        outlines: [],
        pins: [
          {
            padstack_name: padstackName,
            pin_number: 1,
            x: 0,
            y: 0,
          },
        ],
      })
    }

    const xUm = Math.round(hole.x * 1000)
    const yUm = Math.round(hole.y * 1000)

    // Re-use an existing component group if one exists for this image
    let component = pcb.placement.components.find((c) => c.name === imageName)
    if (!component) {
      component = { name: imageName, places: [] }
      pcb.placement.components.push(component)
    }

    component.places.push({
      refdes: `H${holeIndex++}`,
      x: xUm,
      y: yUm,
      side: "front",
      rotation: 0,
    })
  }
}
