import { su } from "@tscircuit/soup-util"
import type {
  AnyCircuitElement,
  PcbComponent,
  SourceComponentBase,
} from "circuit-json"
import type { ComponentGroup } from "lib/dsn-pcb/types"

function normalizeAngle360(angleDeg: number): number {
  const mod = ((angleDeg % 360) + 360) % 360
  return Math.abs(mod) < 1e-6 || Math.abs(mod - 360) < 1e-6
    ? 0
    : Number(mod.toFixed(4))
}

export function getFootprintName(
  sourceComponent: SourceComponentBase,
  pcbComponent: PcbComponent,
): string {
  if (!sourceComponent || !pcbComponent) {
    return ""
  }
  const width = pcbComponent.width == null ? 0 : pcbComponent.width.toFixed(4)
  const height =
    pcbComponent.height == null ? 0 : pcbComponent.height.toFixed(4)
  const normalizedRotation = normalizeAngle360(pcbComponent.rotation ?? 0)
  const rotationSuffix =
    Math.abs(normalizedRotation % 90) > 1e-6 ? `:rot${normalizedRotation}` : ""
  return `${sourceComponent.ftype}:${width}x${height}_mm${rotationSuffix}`
}

export function buildComponentFootprintNameMap(
  componentGroups: ComponentGroup[],
  circuitElements: AnyCircuitElement[],
): Map<string, string> {
  const footprintNameByComponentId = new Map<string, string>()
  const firstRotationByBaseName = new Map<string, number>()
  const pcbComponents = su(circuitElements).pcb_component.list()
  const sourceComponents = su(circuitElements).source_component.list()

  for (const group of componentGroups) {
    const pcbComponent = pcbComponents.find(
      (e) => e.pcb_component_id === group.pcb_component_id,
    )
    if (!pcbComponent) continue
    const sourceComponent = sourceComponents.find(
      (e) => e.source_component_id === pcbComponent.source_component_id,
    )
    const baseName = getFootprintName(sourceComponent!, pcbComponent)
    const normalizedRotation = normalizeAngle360(pcbComponent.rotation ?? 0)
    const existingRotation = firstRotationByBaseName.get(baseName)

    if (existingRotation === undefined) {
      firstRotationByBaseName.set(baseName, normalizedRotation)
      footprintNameByComponentId.set(group.pcb_component_id, baseName)
    } else if (Math.abs(existingRotation - normalizedRotation) < 1e-6) {
      footprintNameByComponentId.set(group.pcb_component_id, baseName)
    } else {
      const disambiguated = baseName.includes(":rot")
        ? baseName
        : `${baseName}:rot${normalizedRotation}`
      footprintNameByComponentId.set(group.pcb_component_id, disambiguated)
    }
  }

  return footprintNameByComponentId
}
