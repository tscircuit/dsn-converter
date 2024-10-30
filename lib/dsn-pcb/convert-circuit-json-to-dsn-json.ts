import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"

import type { Image, DsnPcb, Padstack, Pin, Shape } from "./types"

interface ComponentGroup {
  pcb_component_id: string
  pcb_smtpads: PcbSmtPad[]
}

// Main function to convert circuit JSON to PCB JSON
export function convertCircuitJsonToDsnJson(
  circuitElements: AnyCircuitElement[],
): DsnPcb {
  // Initialize the PCB JSON structure
  const pcb: DsnPcb = {
    filename: "",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "", // Add this line
      host_cad: "", // Add this line
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
          coordinates: [],
        },
      },
      via: "Via[0-1]_600:300_um", // Set default via if needed
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
      padstacks: [],
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

  // Group SMT pads by pcb_component_id
  const componentGroups = groupComponents(circuitElements)

  // Process components and SMT pads
  processComponentsAndPads(componentGroups, circuitElements, pcb)

  // Process nets
  processNets(circuitElements, pcb)

  // Process PCB traces
  processPcbTraces(circuitElements, pcb)

  return pcb
}

// Helper function to group components
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

// Function to process components and SMT pads
function processComponentsAndPads(
  componentGroups: ComponentGroup[],
  circuitElements: AnyCircuitElement[],
  pcb: DsnPcb,
) {
  for (const group of componentGroups) {
    const { pcb_component_id, pcb_smtpads } = group

    if (pcb_smtpads.length === 0) continue

    // Use the pcb_component_id as the component name
    const componentName = pcb_component_id

    // Calculate component center (average of pad positions)
    let sumX = 0
    let sumY = 0

    for (const pad of pcb_smtpads) {
      if (pad.type === "pcb_smtpad") {
        sumX += pad.x * 1000 // Convert mm to um
        sumY += -pad.y * 1000 // Negate Y to match DSN coordinate system
      }
    }

    const centerX = sumX / pcb_smtpads.length
    const centerY = sumY / pcb_smtpads.length

    // Assume all pads are on the same side and rotation
    const side = padLayerToSide(pcb_smtpads[0].layer)

    // Create placement component
    const componentPlacement = {
      name: componentName,
      place: {
        refdes: componentName, // Use componentName as refdes
        PN: componentName, // Add PN property with the same value as refdes
        x: centerX,
        y: centerY,
        side: side,
        rotation: 0,
      },
    }

    pcb.placement.components.push(componentPlacement)

    // Create library image
    const image: Image = {
      name: componentName,
      outlines: [], // Could be reconstructed if necessary
      pins: [],
    }

    for (const pad of pcb_smtpads) {
      if (pad.type === "pcb_smtpad") {
        let padWidthUm
        let padHeightUm
        if (pad.shape === "rect") {
          padWidthUm = pad.width * 1000 // Convert mm to um
          padHeightUm = pad.height * 1000
        } else if (pad.shape === "circle") {
          padWidthUm = padHeightUm = pad.radius * 2 * 1000 // Diameter = 2 * radius
        }

        // Extract padstack_name from pcb_smtpad_id (assuming it's in the format padstackName_pinNumber)
        const padstackName = pad.pcb_smtpad_id.split("_").slice(0, -1).join("_")

        // Calculate pin position relative to component center
        const pinX = pad.x * 1000 - centerX
        const pinY = -pad.y * 1000 - centerY

        const pin: Pin = {
          padstack_name: padstackName,
          pin_number: pad.port_hints ? parseInt(pad.port_hints[0], 10) || 0 : 0,
          x: pinX,
          y: pinY,
        }

        image.pins.push(pin)

        // Add padstack to library.padstacks if not already added
        if (!pcb.library.padstacks.some((ps) => ps.name === padstackName)) {
          const padstack = createPadstack(
            pad,
            padstackName,
            padWidthUm ?? 0,
            padHeightUm ?? 0,
          )
          pcb.library.padstacks.push(padstack)
        }
      }
    }

    pcb.library.images.push(image)
  }
}

// Helper function to create padstack
function createPadstack(
  pad: AnyCircuitElement,
  padstackName: string,
  widthUm: number,
  heightUm: number,
): Padstack {
  // Create the padstack shape based on the pad shape
  let shape = null

  if ("shape" in pad && pad.type === "pcb_smtpad") {
    if (pad.shape === "rect") {
      // For a rectangle, we can represent it as a polygon with four corners
      const halfWidth = widthUm / 2
      const halfHeight = heightUm / 2

      const coordinates = [
        -halfWidth,
        halfHeight,
        halfWidth,
        halfHeight,
        halfWidth,
        -halfHeight,
        -halfWidth,
        -halfHeight,
        -halfWidth,
        halfHeight, // Close the polygon
      ]

      shape = {
        shapeType: "polygon",
        layer: "F.Cu", // Assuming front copper layer
        width: 0,
        coordinates: coordinates,
      }
    } else if (pad.shape === "circle") {
      // For a circle, we need the diameter
      const diameter = widthUm // Assuming width equals diameter
      shape = {
        shapeType: "circle",
        layer: "F.Cu",
        diameter: diameter,
      }
    } else {
      // Handle other shapes if necessary
      shape = {
        shapeType: "polygon",
        layer: "F.Cu",
        width: 0,
        coordinates: [],
      }
    }
  }

  const padstack: Padstack = {
    name: padstackName,
    shapes: [shape].filter((s): s is Shape => s !== null), // Filter out null values
    attach: "off",
  }

  return padstack
}

// Helper function to map layer to side
function padLayerToSide(layer: string): "front" | "back" {
  return layer === "top" ? "front" : "back"
}

// Function to process nets
function processNets(circuitElements: AnyCircuitElement[], pcb: DsnPcb) {
  // Build a map of pad IDs to pads
  const padMap = new Map<string, AnyCircuitElement>()

  for (const element of circuitElements) {
    if (element.type === "pcb_smtpad") {
      padMap.set(element.pcb_port_id ?? "", element)
    }
  }

  // Build nets based on pad connections
  // This is a simplified version, assuming that pads connected via traces belong to the same net

  // Map from net name to set of pad IDs
  const netMap = new Map<string, Set<string>>()

  // Process pcb_traces to build net associations
  for (const element of circuitElements) {
    if (element.type === "pcb_trace") {
      const pcbTrace = element

      const netName =
        pcbTrace.source_trace_id || `Net-${pcb.network.nets.length + 1}`

      if (!netMap.has(netName)) {
        netMap.set(netName, new Set())
      }

      // For simplicity, associate pads that are endpoints of the trace
      const startPoint = pcbTrace.route[0]
      const endPoint = pcbTrace.route[pcbTrace.route.length - 1]

      // Find pads near the start and end points
      for (const pad of padMap.values()) {
        if (pad.type === "pcb_smtpad") {
          const padX = pad.x
          const padY = pad.y
          const startX = startPoint.x
          const startY = startPoint.y
          const endX = endPoint.x
          const endY = endPoint.y

          const startDistance = Math.hypot(padX - startX, padY - startY)
          const endDistance = Math.hypot(padX - endX, padY - endY)

          if (startDistance < 0.1 || endDistance < 0.1) {
            netMap.get(netName)?.add(pad.pcb_port_id ?? "")
          }
        }
      }
    }
  }

  // Build nets
  for (const [netName, padIds] of netMap.entries()) {
    const net = {
      name: netName,
      pins: [] as string[],
    }

    for (const padId of padIds) {
      const pad = padMap.get(padId)
      if (pad && pad.type === "pcb_smtpad") {
        const componentId = pad.pcb_component_id
        const componentName = componentId
        const pinNumber = pad.port_hints ? pad.port_hints[0] : ""

        const pinRef = `${componentName}-${pinNumber}`
        net.pins.push(pinRef)
      }
    }

    pcb.network.nets.push(net)
    pcb.network.classes[0].net_names.push(net.name)
  }
}

// Function to process PCB traces
function processPcbTraces(circuitElements: AnyCircuitElement[], pcb: DsnPcb) {
  for (const element of circuitElements) {
    if (element.type === "pcb_trace") {
      const pcbTrace = element

      const netName =
        pcbTrace.source_trace_id || `Net-${pcb.network.nets.length + 1}`

      const wire = {
        path: {
          layer:
            pcbTrace.route[0].route_type === "wire"
              ? pcbTrace.route[0].layer === "top"
                ? "F.Cu"
                : "B.Cu"
              : "F.Cu", // Default to F.Cu if not a wire route
          width:
            pcbTrace.route[0].route_type === "wire"
              ? pcbTrace.route[0].width * 1000
              : 200, // Convert mm to um, or use a default value
          coordinates: [] as number[],
        },
        net: netName,
        type: "route",
      }

      for (const point of pcbTrace.route) {
        wire.path.coordinates.push(point.x * 1000) // Convert mm to um
        wire.path.coordinates.push(-point.y * 1000) // Negate Y to match DSN coordinate system
      }

      pcb.wiring.wires.push(wire)
    }
  }
}
