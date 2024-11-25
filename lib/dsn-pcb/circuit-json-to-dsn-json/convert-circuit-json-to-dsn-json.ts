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
        clearances: [
          {
            value: 200,
          },
          {
            value: 200,
            type: "default_smd",
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
            clearances: [
              {
                value: 200,
                type: "",
              },
            ],
            width: 200,
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
  processPlatedHoles(circuitElements, pcb)
  processNets(circuitElements, pcb)
  processPcbTraces(circuitElements, pcb)

  return pcb
}

function calculateBoardBoundary(pcbBoard: {
  width: number
  height: number
  center: { x: number; y: number }
}): number[] {
  // Convert dimensions from mm to μm and calculate corners
  const halfWidth = (pcbBoard.width * 1000) / 2
  const halfHeight = (pcbBoard.height * 1000) / 2
  const centerX = pcbBoard.center.x * 1000
  const centerY = pcbBoard.center.y * 1000

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
