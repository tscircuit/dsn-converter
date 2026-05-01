import type { AnyCircuitElement } from "circuit-json"
import {
  generateLayerNames,
  generateLayers,
  getViaPadstackName,
} from "lib/utils/generate-layers"
import type { ComponentGroup, DsnPcb, Padstack } from "../types"
import { processComponentsAndPads } from "./process-components-and-pads"
import { processNets } from "./process-nets"
import { processPcbHoles } from "./process-pcb-holes"
import { processPcbTraces } from "./process-pcb-traces"
import { processPlatedHoles } from "./process-plated-holes"

export function convertCircuitJsonToDsnJson(
  circuitElements: AnyCircuitElement[],
  options: {
    traceClearance?: number
  } = {},
): DsnPcb {
  // Find the PCB board element
  const pcbBoard = circuitElements.find(
    (element) => element.type === "pcb_board",
  ) as AnyCircuitElement & {
    width: number
    height: number
    center: { x: number; y: number }
    num_layers?: number
  }

  const numLayers = pcbBoard?.num_layers ?? 2
  const layers = generateLayers(numLayers)
  const layerNames = generateLayerNames(numLayers)
  const defaultViaName = getViaPadstackName(numLayers, 600, 300)

  const pcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    resolution: {
      unit: "um",
      value: 10,
    },
    unit: "um",
    structure: {
      layers,
      boundary: {
        path: {
          layer: "pcb",
          width: 0,
          coordinates: calculateBoardBoundary(pcbBoard),
        },
      },
      via: defaultViaName,
      rule: {
        // Default clearance having fallback value
        clearances: [
          {
            value: options.traceClearance ?? 150,
          },
          {
            value: 50,
            type: "smd_smd",
          },
        ],
        width: 200,
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
            // Actual value being used in the dsn for the specific network class
            clearances: [
              {
                value: options.traceClearance ?? 150, // standard value
              },
            ],
            width: 150, // trace width used in freerouting
          },
        },
      ],
    },
    wiring: {
      wires: [],
    },
  }

  const componentGroups = groupComponents(circuitElements)
  processComponentsAndPads(componentGroups, circuitElements, pcb)
  processPlatedHoles(componentGroups, circuitElements, pcb, numLayers)
  processPcbHoles(circuitElements, pcb)
  processNets(circuitElements, pcb)
  processPcbTraces(circuitElements, pcb, numLayers)
  return pcb
}

function calculateBoardBoundary(pcbBoard: {
  width: number
  height: number
  center: { x: number; y: number }
}): number[] {
  // default to 100mm x 100mm if not provided
  const width = pcbBoard?.width ?? 100
  const height = pcbBoard?.height ?? 100
  const x = pcbBoard?.center?.x ?? 0
  const y = pcbBoard?.center?.y ?? 0

  // Convert dimensions from mm to μm and calculate corners
  const halfWidth = (width * 1000) / 2
  const halfHeight = (height * 1000) / 2
  const centerX = x * 1000
  const centerY = y * 1000

  // Return coordinates for a rectangular boundary path
  // Format: [x1, y1, x2, y2, x3, y3, x4, y4, x1, y1] to close the path
  return [
    centerX - halfWidth,
    centerY - halfHeight, // Top left
    centerX + halfWidth,
    centerY - halfHeight, // Top right
    centerX + halfWidth,
    centerY + halfHeight, // Bottom right
    centerX - halfWidth,
    centerY + halfHeight, // Bottom left
    centerX - halfWidth,
    centerY - halfHeight, // Back to top left to close the path
  ]
}

function groupComponents(
  circuitElements: AnyCircuitElement[],
): ComponentGroup[] {
  const componentMap = new Map<string, ComponentGroup>()

  for (const element of circuitElements) {
    if (element.type === "pcb_smtpad" || element.type === "pcb_plated_hole") {
      const componentId = element.pcb_component_id ?? ""

      if (!componentMap.has(componentId)) {
        componentMap.set(componentId, {
          pcb_component_id: componentId,
          pcb_smtpads: [],
          pcb_plated_holes: [],
        })
      }

      if (element.type === "pcb_smtpad") {
        componentMap.get(componentId)?.pcb_smtpads.push(element)
      } else if (element.type === "pcb_plated_hole") {
        componentMap.get(componentId)?.pcb_plated_holes.push(element)
      }
    }
  }

  return Array.from(componentMap.values())
}
