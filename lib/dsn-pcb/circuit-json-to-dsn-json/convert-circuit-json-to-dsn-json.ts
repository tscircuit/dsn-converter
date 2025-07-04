import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, Padstack, ComponentGroup } from "../types"
import { processComponentsAndPads } from "./process-components-and-pads"
import { processNets } from "./process-nets"
import { processPcbTraces } from "./process-pcb-traces"
import { processPlatedHoles } from "./process-plated-holes"

export function convertCircuitJsonToDsnJson(
  circuitElements: AnyCircuitElement[],
): DsnPcb {
  // Find the PCB board element
  const pcbBoard = circuitElements.find(
    (element) => element.type === "pcb_board",
  ) as AnyCircuitElement & {
    width: number
    height: number
    center: { x: number; y: number }
  }

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
      layers: [
        {
          name: "F.Cu",
          type: "signal",
          property: {
            index: 0,
          },
        },
        {
          name: "B.Cu",
          type: "signal",
          property: {
            index: 1,
          },
        },
      ],
      boundary: {
        path: {
          layer: "pcb",
          width: 0,
          coordinates: calculateBoardBoundary(pcbBoard),
        },
      },
      via: "Via[0-1]_600:300_um",
      rule: {
        // Default clearance having fallback value
        clearances: [
          {
            value: 300, // fallback gap between any <-> any
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
          name: "Via[0-1]_600:300_um",
          shapes: [
            {
              shapeType: "circle",
              layer: "F.Cu",
              diameter: 600,
            },
            {
              shapeType: "circle",
              layer: "B.Cu",
              diameter: 600,
            },
          ],
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
            use_via: "Via[0-1]_600:300_um",
          },
          rule: {
            // Actual value being used in the dsn for the specific network class
            clearances: [
              {
                value: 300,
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
  processPlatedHoles(componentGroups, circuitElements, pcb)
  processNets(circuitElements, pcb)
  processPcbTraces(circuitElements, pcb)
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
