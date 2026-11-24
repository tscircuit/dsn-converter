import { su } from "@tscircuit/soup-util"
import type {
  AnyCircuitElement,
  SourceComponentBase,
  SourcePort,
} from "circuit-json"
import {
  createCircularHoleRectangularPadstack,
  createCircularPadstack,
  createOvalPadstack,
} from "lib/utils/create-padstack"
import { getComponentValue } from "lib/utils/get-component-value"
import { getFootprintName } from "lib/utils/get-footprint-name"
import { getPadstackName } from "lib/utils/get-padstack-name"
import { applyToPoint, scale } from "transformation-matrix"
import type { ComponentGroup, DsnPcb, Image, Pin } from "../types"

const transformMmToUm = scale(1000)

export function processPlatedHoles(
  componentGroups: ComponentGroup[],
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
  numLayers = 2,
  footprintNameByComponentId?: Map<string, string>,
) {
  /**
   * Helpers
   */
  const processedPadstacks = new Set<string>()

  /** Normalize symmetric oval/rect rotation into [0, 180) degrees */
  function normalizeSymmetricRotation(angleDeg: number): number {
    const mod = ((angleDeg % 180) + 180) % 180
    return Math.abs(mod) < 1e-6 || Math.abs(mod - 180) < 1e-6
      ? 0
      : Number(mod.toFixed(4))
  }

  /** Guarantee that a padstack for the given plated-hole exists, return its name */
  function ensurePadstack(hole: any, componentRotation = 0): string {
    const effectiveRotation = normalizeSymmetricRotation(
      hole.ccw_rotation ?? componentRotation,
    )
    const isSwapped90 = Math.abs(effectiveRotation - 90) < 1e-6
    const isNonOrthogonal = effectiveRotation !== 0 && !isSwapped90

    switch (hole.shape) {
      case "circle": {
        const name = getPadstackName({
          shape: "circle",
          holeDiameter: hole.hole_diameter * 1000,
          outerDiameter: hole.outer_diameter * 1000,
          layer: "all",
        })
        if (!processedPadstacks.has(name)) {
          const d = Math.round(hole.outer_diameter * 1000)
          pcb.library.padstacks.push(
            createCircularPadstack(name, d, d, numLayers),
          )
          processedPadstacks.add(name)
        }
        return name
      }
      case "oval":
      case "pill": {
        const holeWidthUm =
          (isSwapped90 ? hole.hole_height : hole.hole_width) * 1000
        const holeHeightUm =
          (isSwapped90 ? hole.hole_width : hole.hole_height) * 1000
        const baseName = getPadstackName({
          shape: hole.shape,
          width: holeWidthUm,
          height: holeHeightUm,
          layer: "all",
        })
        const name = isNonOrthogonal
          ? baseName.replace(/_um$/, `_rot${effectiveRotation}deg_um`)
          : baseName
        if (!processedPadstacks.has(name)) {
          const iW = Math.round(holeWidthUm)
          const iH = Math.round(holeHeightUm)
          const oW = Math.round(
            (isSwapped90 ? hole.outer_height : hole.outer_width) * 1000,
          )
          const oH = Math.round(
            (isSwapped90 ? hole.outer_width : hole.outer_height) * 1000,
          )
          pcb.library.padstacks.push(
            createOvalPadstack(
              name,
              oW,
              oH,
              iW,
              iH,
              numLayers,
              isNonOrthogonal ? effectiveRotation : 0,
            ),
          )
          processedPadstacks.add(name)
        }
        return name
      }
      case "circular_hole_with_rect_pad": {
        const padWidthUm =
          (isSwapped90 ? hole.rect_pad_height : hole.rect_pad_width) * 1000
        const padHeightUm =
          (isSwapped90 ? hole.rect_pad_width : hole.rect_pad_height) * 1000
        const baseName = getPadstackName({
          shape: "rect",
          width: padWidthUm,
          height: padHeightUm,
          layer: "all",
        })
        const name = isNonOrthogonal
          ? baseName.replace(/_um$/, `_rot${effectiveRotation}deg_um`)
          : baseName
        if (!processedPadstacks.has(name)) {
          const oW = Math.round(padWidthUm)
          const oH = Math.round(padHeightUm)
          const hD = Math.round(hole.hole_diameter * 1000)
          pcb.library.padstacks.push(
            createCircularHoleRectangularPadstack(
              name,
              oW,
              oH,
              hD,
              numLayers,
              isNonOrthogonal ? effectiveRotation : 0,
            ),
          )
          processedPadstacks.add(name)
        }
        return name
      }
      default:
        throw new Error(`Unsupported plated-hole shape: ${hole.shape}`)
    }
  }

  /** Find or create an Image definition for the given footprint */
  function ensureImage(name: string): Image {
    let image = pcb.library.images.find((img) => img.name === name)
    if (!image) {
      image = { name, outlines: [], pins: [] }
      pcb.library.images.push(image)
    }
    return image
  }

  /** Returns a generator that yields the next unique pin number for the image */
  function createNextPinNumberGenerator(image: Image) {
    let current =
      image.pins.reduce((max, p) => {
        const n = Number(
          typeof p.pin_number === "string"
            ? p.pin_number.replace(/pin/i, "")
            : p.pin_number,
        )
        return Number.isNaN(n) ? max : Math.max(max, n)
      }, 0) + 1
    return () => current++
  }

  function findNumericHint(port?: SourcePort): number | undefined {
    const hint = port?.port_hints?.find((h) => !Number.isNaN(Number(h)))
    return hint !== undefined ? Number(hint) : undefined
  }

  /**
   * MAIN
   */

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

  for (const group of componentGroups) {
    const { pcb_component_id, pcb_plated_holes, pcb_smtpads } = group
    if (pcb_plated_holes.length === 0) continue

    const pcbComponent = su(circuitElements)
      .pcb_component.list()
      .find((e) => e.pcb_component_id === pcb_component_id)
    if (!pcbComponent) continue

    const sourceComponent = su(circuitElements)
      .source_component.list()
      .find((e) => e.source_component_id === pcbComponent.source_component_id)

    const footprintName =
      footprintNameByComponentId?.get(pcb_component_id) ??
      getFootprintName(sourceComponent!, pcbComponent!)
    const image = ensureImage(footprintName)
    const nextPinNumber = createNextPinNumberGenerator(image)

    // Create/update pins for every plated hole
    for (const hole of pcb_plated_holes) {
      const padstackName = ensurePadstack(hole, pcbComponent.rotation || 0)

      // Resolve sourcePort (if any)
      const pcbPort = hole.pcb_port_id
        ? su(circuitElements)
            .pcb_port.list()
            .find((e) => e.pcb_port_id === hole.pcb_port_id)
        : undefined
      const sourcePort = pcbPort
        ? su(circuitElements)
            .source_port.list()
            .find((e) => e.source_port_id === pcbPort.source_port_id)
        : undefined

      const pinNumber = findNumericHint(sourcePort) ?? nextPinNumber()

      const pin: Pin = {
        padstack_name: padstackName,
        pin_number: pinNumber,
        x: (Number(hole.x.toFixed(3)) - pcbComponent.center.x) * 1000,
        y: (Number(hole.y.toFixed(3)) - pcbComponent.center.y) * 1000,
      }

      // Avoid duplicates
      const duplicate = image.pins.some(
        (p) =>
          p.x === pin.x &&
          p.y === pin.y &&
          p.padstack_name === pin.padstack_name,
      )
      if (!duplicate) image.pins.push(pin)
    }

    // Record components that ONLY have plated holes (no SMT pads) for placement later
    if (pcb_smtpads.length === 0) {
      const key = footprintName
      if (!componentsByFootprint.has(key)) componentsByFootprint.set(key, [])

      componentsByFootprint.get(key)!.push({
        componentName: sourceComponent?.name || "Unknown",
        coordinates: applyToPoint(transformMmToUm, pcbComponent.center),
        rotation: pcbComponent.rotation || 0,
        value: getComponentValue(sourceComponent),
        sourceComponent,
      })
    }
  }

  // Emit placement data for plated-hole-only footprints
  for (const [footprint, comps] of componentsByFootprint) {
    pcb.placement.components.push({
      name: footprint,
      places: comps.map((c) => ({
        refdes: `${c.componentName}_${c.sourceComponent?.source_component_id}`,
        x: c.coordinates.x,
        y: c.coordinates.y,
        side: "front" as const,
        rotation: 0,
        PN: c.value,
      })),
    })
  }
}
