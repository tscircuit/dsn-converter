import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, Padstack, ComponentGroup } from "../types"
import { processComponentsAndPads } from "./process-components-and-pads"
import { processNets } from "./process-nets"

export function convertCircuitJsonToDsnJson(
  circuitElements: AnyCircuitElement[],
): DsnPcb {
  const pcb: DsnPcb = {
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
          coordinates: [
            158000, -108000, 147500, -108000, 147500, -102000, 158000, -102000,
            158000, -108000,
          ],
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
  processNets(circuitElements, pcb)

  return pcb
}

function groupComponents(
  circuitElements: AnyCircuitElement[],
): ComponentGroup[] {
  const componentMap = new Map<string, ComponentGroup>()

  for (const element of circuitElements) {
    if (element.type === "pcb_smtpad") {
      const pcbPad = element
      const componentId = pcbPad.pcb_component_id ?? ""

      if (!componentMap.has(componentId)) {
        componentMap.set(componentId, {
          pcb_component_id: componentId,
          pcb_smtpads: [],
        })
      }
      componentMap.get(componentId)?.pcb_smtpads.push(pcbPad)
    }
  }

  return Array.from(componentMap.values())
}