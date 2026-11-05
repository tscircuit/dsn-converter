import { su } from "@tscircuit/soup-util"
import type { AnyCircuitElement, SourceComponentBase } from "circuit-json"
import { createAndAddPadstackFromPcbSmtPad } from "lib/utils/create-and-add-padstack-for-pcb-smtpad"
import { createPinForImage } from "lib/utils/create-pin-for-image"
import { getComponentValue } from "lib/utils/get-component-value"
import { getFootprintName } from "lib/utils/get-footprint-name"
import { applyToPoint, scale } from "transformation-matrix"
import type { ComponentGroup, DsnPcb, Image, Pin } from "../types"

const transformMmToUm = scale(1000)

export function processComponentsAndPads(
  componentGroups: ComponentGroup[],
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  const processedPadstacks = new Set<string>()
  const componentsByFootprint = new Map<
    string,
    Array<{
      pcbComponentId: string
      pcbComponent: NonNullable<
        ReturnType<ReturnType<typeof su>["pcb_component"]["list"]>[number]
      >
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

    const pcbComponent = su(circuitElements)
      .pcb_component.list()
      .find((e) => e.pcb_component_id === pcb_component_id)
    if (!pcbComponent) continue

    const sourceComponent = su(circuitElements)
      .source_component.list()
      .find((e) => e.source_component_id === pcbComponent.source_component_id)

    const footprintName = getFootprintName(sourceComponent, pcbComponent)
    const componentName =
      sourceComponent?.name || pcbComponent.pcb_component_id || "Unknown"
    const circuitSpaceCoordinates = applyToPoint(
      transformMmToUm,
      pcbComponent.center,
    )

    if (!componentsByFootprint.has(footprintName)) {
      componentsByFootprint.set(footprintName, [])
    }

    componentsByFootprint.get(footprintName)?.push({
      pcbComponentId: pcb_component_id,
      pcbComponent,
      componentName,
      coordinates: circuitSpaceCoordinates,
      rotation: pcbComponent.rotation || 0,
      value: getComponentValue(sourceComponent),
      sourceComponent,
    })
  }

  // Second pass: Process each footprint group
  for (const [footprintName, components] of componentsByFootprint) {
    // All are having the same footprint so getting the first one
    const firstComponent = components[0]
    const componentGroup = componentGroups.find(
      (group) => group.pcb_component_id === firstComponent.pcbComponentId,
    )

    if (!componentGroup) continue

    // Add padstacks for SMT pads
    for (const pad of componentGroup.pcb_smtpads) {
      createAndAddPadstackFromPcbSmtPad({
        pcb,
        pad,
        processedPadstacks,
      })
    }

    // Add image once per footprint
    const image: Image = {
      name: footprintName,
      outlines: [],
      pins: componentGroup.pcb_smtpads
        .map((pad, index) => {
          // Find the corresponding pcb_port and its source_port
          const pcbPort = su(circuitElements)
            .pcb_port.list()
            .find((e) => e.pcb_port_id === pad.pcb_port_id)
          const sourcePort = su(circuitElements)
            .source_port.list()
            .find((e) => e.source_port_id === pcbPort?.source_port_id)

          return createPinForImage({
            pad,
            pcbComponent: firstComponent.pcbComponent,
            sourcePort,
            defaultPinNumber: index + 1,
          })
        })
        .filter((pin): pin is Pin => pin !== undefined),
    }
    pcb.library.images.push(image)

    // Add component entry
    const componentEntry = {
      name: footprintName,
      places: components.map((component) => {
        const idSuffix =
          component.sourceComponent?.source_component_id ??
          component.pcbComponentId
        const refdes =
          idSuffix &&
          component.componentName !== idSuffix &&
          !component.componentName.endsWith(`_${idSuffix}`)
            ? `${component.componentName}_${idSuffix}`
            : component.componentName
        return {
          refdes,
          x: component.coordinates.x,
          y: component.coordinates.y,
          side: "front" as const,
          rotation: component.rotation % 90,
          PN: component.value,
        }
      }),
    }
    pcb.placement.components.push(componentEntry)
  }
}
