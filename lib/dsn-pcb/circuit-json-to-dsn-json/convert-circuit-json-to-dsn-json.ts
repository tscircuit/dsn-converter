import type { AnyCircuitElement } from "circuit-json"
import {
  generateLayerNames,
  generateLayers,
  getViaPadstackName,
} from "lib/utils/generate-layers"
import type { ComponentGroup, DsnPcb, Padstack } from "../types"
import { processComponentsAndPads } from "./process-components-and-pads"
import { processNets } from "./process-nets"
import { processPcbTraces } from "./process-pcb-traces"
import { processPlatedHoles } from "./process-plated-holes"

export function convertCircuitJsonToDsnJson(
  circuitElements: AnyCircuitElement[],
  options: {
    traceClearance?: number
    resolution?: number
  } = {},
): DsnPcb {
  // Find the PCB board element
  const pcbBoard = circuitElements.find(
    (element) => element.type === "pcb_board",
  ) as any

  const numLayers = pcbBoard?.num_layers ?? 2
  const layers = generateLayers(numLayers)
  const layerNames = generateLayerNames(numLayers)
  const defaultViaName = getViaPadstackName(numLayers, 600, 300)

  // Use resolution from options or default to 1
  const resolution = options.resolution ?? 1

  const pcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "",
    parser: {
      string_quote: '"',
      host_version: "",
      space_in_quoted_tokens: "on",
      host_cad: "KiCad's Pcbnew",
    },
    resolution: {
      unit: "um",
      value: resolution,
    },
    unit: "um",
    structure: {
      layers,
      boundary: {
        path: {
          layer: "pcb",
          width: 0,
          coordinates: calculateBoardBoundary(pcbBoard, resolution),
        },
      },
      via: defaultViaName,
      rule: {
        width: 250,
        clearances: [
          {
            value: options.traceClearance ?? 150,
          },
        ],
      },
    },
    placement: {
      components: [],
    },
    library: {
      images: [],
      padstacks: [
        {
          name: defaultViaName,
          shapes: layerNames.map((name) => ({
            shapeType: "circle" as const,
            layer: name,
            diameter: 600,
          })),
          attach: "off",
        },
      ],
    },
    network: {
      nets: [],
      classes: [
        {
          name: "kicad_default",
          description: "",
          net_names: [],
          circuit: {
            use_via: defaultViaName,
          },
          rule: {
            clearances: [
              {
                value: options.traceClearance ?? 150,
              },
            ],
            width: 150,
          },
        },
      ],
    },
    wiring: {
      wires: [],
    },
  }

  const componentGroups = groupCircuitElements(circuitElements)

  processComponentsAndPads(componentGroups, circuitElements, pcb)
  processPlatedHoles(componentGroups, circuitElements, pcb, numLayers)
  processNets(circuitElements, pcb)
  processPcbTraces(circuitElements, pcb, numLayers)

  return pcb
}

function calculateBoardBoundary(pcbBoard: any, resolution: number): number[] {
  const width = pcbBoard?.width ?? 100
  const height = pcbBoard?.height ?? 100
  const x = pcbBoard?.center?.x ?? 0
  const y = pcbBoard?.center?.y ?? 0

  const multiplier = 1000 * resolution
  const halfWidth = (width * multiplier) / 2
  const halfHeight = (height * multiplier) / 2
  const centerX = x * multiplier
  const centerY = y * multiplier

  return [
    centerX - halfWidth,
    centerY - halfHeight,
    centerX + halfWidth,
    centerY - halfHeight,
    centerX + halfWidth,
    centerY + halfHeight,
    centerX - halfWidth,
    centerY + halfHeight,
    centerX - halfWidth,
    centerY - halfHeight,
  ]
}

function groupCircuitElements(
  circuitElements: AnyCircuitElement[],
): ComponentGroup[] {
  const componentMap = new Map<string, ComponentGroup>()

  // Initialize groups for all pcb_components
  for (const element of circuitElements) {
    if (element.type === "pcb_component") {
      componentMap.set(element.pcb_component_id, {
        pcb_component_id: element.pcb_component_id,
        pcb_smtpads: [],
        pcb_plated_holes: [],
      })
    }
  }

  // Assign pads and holes to groups
  for (const element of circuitElements) {
    if (element.type === "pcb_smtpad" || element.type === "pcb_plated_hole") {
      const componentId = element.pcb_component_id
      if (!componentId) continue

      let group = componentMap.get(componentId)
      if (!group) {
        group = {
          pcb_component_id: componentId,
          pcb_smtpads: [],
          pcb_plated_holes: [],
        }
        componentMap.set(componentId, group)
      }

      if (element.type === "pcb_smtpad") {
        group.pcb_smtpads.push(element)
      } else if (element.type === "pcb_plated_hole") {
        group.pcb_plated_holes.push(element)
      }
    }
  }

  return Array.from(componentMap.values())
}
