import type { AnyCircuitElement } from "circuit-json"
import {
  generateLayerNames,
  generateLayers,
  getViaPadstackName,
} from "lib/utils/generate-layers"
import type { ComponentGroup, DsnPcb, Padstack } from "../types"
import { processComponentsAndPads } from "./process-components-and-pads"
import { micronsToDsnUnits, mmToDsnUnits } from "./dsn-unit-conversion"
import { processNets } from "./process-nets"
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
  const resolution = {
    unit: "um",
    value: 10,
  }
  const defaultViaName = getViaPadstackName(numLayers, 600, 300)
  const defaultViaDiameter = micronsToDsnUnits(600, resolution)

  const pcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    resolution,
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
        // Default clearance having fallback value
        clearances: [
          {
            value: micronsToDsnUnits(options.traceClearance ?? 150, resolution),
          },
          {
            value: micronsToDsnUnits(50, resolution),
            type: "smd_smd",
          },
        ],
        width: micronsToDsnUnits(200, resolution),
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
            diameter: defaultViaDiameter,
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
                value: micronsToDsnUnits(
                  options.traceClearance ?? 150,
                  resolution,
                ), // standard value
              },
            ],
            width: micronsToDsnUnits(150, resolution), // trace width used in freerouting
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
  processNets(circuitElements, pcb)
  processPcbTraces(circuitElements, pcb, numLayers)
  return pcb
}

function calculateBoardBoundary(pcbBoard: {
  width: number
  height: number
  center: { x: number; y: number }
}, resolution: DsnPcb["resolution"]): number[] {
  // default to 100mm x 100mm if not provided
  const width = pcbBoard?.width ?? 100
  const height = pcbBoard?.height ?? 100
  const x = pcbBoard?.center?.x ?? 0
  const y = pcbBoard?.center?.y ?? 0

  // Convert dimensions from mm to μm and calculate corners
  const halfWidth = mmToDsnUnits(width / 2, resolution)
  const halfHeight = mmToDsnUnits(height / 2, resolution)
  const centerX = mmToDsnUnits(x, resolution)
  const centerY = mmToDsnUnits(y, resolution)

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
