import type {
  AnyCircuitElement,
  PcbComponent,
  SourceComponentBase,
} from "circuit-json"
import { getComponentValue } from "lib/utils/get-component-value"
import { getFootprintName } from "lib/utils/get-footprint-name"
import { getPadstackName } from "lib/utils/get-padstack-name"
import type { DsnPcb, ComponentGroup, Padstack } from "../types"
import { applyToPoint, fromTriangles } from "transformation-matrix"

const dsnSpaceCoordinates = [
  { x: 148405, y: -105000 },
  { x: 156105, y: -105000 },
  { x: 156105, y: 0 },
]

const circuitSpaceCoordinates = [
  { x: -3.5, y: 0 },
  { x: 3.5, y: 0 },
  { x: 3.5, y: 10 },
]

const transform = fromTriangles(circuitSpaceCoordinates, dsnSpaceCoordinates)

function getComponentPins(): Array<{ x: number; y: number }> {
  return [
    { x: -500, y: 0 },
    { x: 500, y: 0 },
  ]
}

function createExactPadstack(padstackName: string): Padstack {
  return {
    name: padstackName,
    shapes: [
      {
        shapeType: "polygon",
        layer: "F.Cu",
        width: 0,
        coordinates: [
          -300.0, 300.0, 300.0, 300.0, 300.0, -300.0, -300.0, -300.0, -300.0,
          300.0,
        ],
      },
    ],
    attach: "off",
  }
}

export function processComponentsAndPads(
  componentGroups: ComponentGroup[],
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  const processedPadstacks = new Set<string>()

  for (const group of componentGroups) {
    const { pcb_component_id, pcb_smtpads } = group
    if (pcb_smtpads.length === 0) continue

    const sourceComponent = circuitElements.find(
      (e) =>
        e.type === "pcb_component" && e.pcb_component_id === pcb_component_id,
    ) as PcbComponent
    const srcComp =
      sourceComponent &&
      (circuitElements.find(
        (e) =>
          e.type === "source_component" &&
          e.source_component_id === sourceComponent.source_component_id,
      ) as SourceComponentBase)

    const footprintName = getFootprintName(srcComp?.ftype)
    const componentName = srcComp?.name || "Unknown"

    // Transform component coordinates
    const circuitSpaceCoordinates = applyToPoint(
      transform,
      sourceComponent.center,
    )

    // Fixed placement coordinates
    const componentPlacement = {
      name: footprintName,
      place: {
        refdes: componentName,
        x: circuitSpaceCoordinates.x,
        y: circuitSpaceCoordinates.y,
        side: "front" as const,
        rotation: 0,
        PN: getComponentValue(srcComp),
      },
    }

    // Handle padstacks
    const padstackName = getPadstackName(srcComp?.ftype)
    if (!processedPadstacks.has(padstackName)) {
      const padstack = createExactPadstack(padstackName)
      pcb.library.padstacks.push(padstack)
      processedPadstacks.add(padstackName)
    }

    // Create image with exact pin positions
    const image = {
      name: footprintName,
      outlines: [],
      pins: getComponentPins().map((pos, index) => ({
        padstack_name: padstackName,
        pin_number: index + 1,
        x: pos.x,
        y: pos.y,
      })),
    }

    pcb.library.images.push(image)
    pcb.placement.components.push(componentPlacement)
  }
}
