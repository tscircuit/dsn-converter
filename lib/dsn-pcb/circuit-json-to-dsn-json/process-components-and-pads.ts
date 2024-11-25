import type {
  AnyCircuitElement,
  PcbComponent,
  SourceComponentBase,
} from "circuit-json"
import { getComponentValue } from "lib/utils/get-component-value"
import { getFootprintName } from "lib/utils/get-footprint-name"
import { applyToPoint, scale } from "transformation-matrix"
import type { ComponentGroup, DsnPcb, Padstack } from "../types"

const transformMmToUm = scale(1000)

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
  const componentsByFootprint = new Map<
    string,
    Array<{
      componentName: string
      coordinates: { x: number; y: number }
      rotation: number
      value: string
      sourceComponent: SourceComponentBase | undefined
    }>
  >()

  // First pass: Group components by footprint
  for (const group of componentGroups) {
    const { pcb_component_id, pcb_smtpads } = group
    if (pcb_smtpads.length === 0) continue

    const pcbComponent = circuitElements.find(
      (e) =>
        e.type === "pcb_component" && e.pcb_component_id === pcb_component_id,
    ) as PcbComponent
    const sourceComponent =
      pcbComponent &&
      (circuitElements.find(
        (e) =>
          e.type === "source_component" &&
          e.source_component_id === pcbComponent.source_component_id,
      ) as SourceComponentBase)

    const footprintName = getFootprintName(sourceComponent?.ftype)
    const componentName = sourceComponent?.name || "Unknown"
    const circuitSpaceCoordinates = applyToPoint(
      transformMmToUm,
      pcbComponent.center,
    )

    if (!componentsByFootprint.has(footprintName)) {
      componentsByFootprint.set(footprintName, [])
    }

    componentsByFootprint.get(footprintName)?.push({
      componentName,
      coordinates: circuitSpaceCoordinates,
      rotation: pcbComponent?.rotation || 0,
      value: getComponentValue(sourceComponent),
      sourceComponent,
    })
  }

  // Second pass: Process each footprint group
  for (const [footprintName, components] of componentsByFootprint) {
    // Add image once per footprint
    const image = {
      name: footprintName,
      outlines: [],
      pins: getComponentPins().map((pos, index) => ({
        padstack_name: `default_pad_${footprintName}`,
        pin_number: index + 1,
        x: pos.x,
        y: pos.y,
      })),
    }
    pcb.library.images.push(image)

    // Add padstack once per footprint
    if (!processedPadstacks.has(footprintName)) {
      const padstack = createExactPadstack(`default_pad_${footprintName}`)
      pcb.library.padstacks.push(padstack)
      processedPadstacks.add(footprintName)
    }

    // Add one component entry per footprint with all placements
    const componentEntry = {
      name: footprintName,
      places: components.map((component) => ({
        refdes: component.componentName,
        x: component.coordinates.x,
        y: component.coordinates.y,
        side: "front" as const,
        rotation: component.rotation,
        PN: component.value,
      })),
    }
    pcb.placement.components.push(componentEntry)
  }
}
