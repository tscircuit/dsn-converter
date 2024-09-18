import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

import type {
  AnyCircuitElement,
  LayerRef,
  PCBBoard,
  PCBTrace,
  SourceNet,
} from "@tscircuit/soup";

import type {
  Boundary,
  Image,
  Library,
  Network,
  PCB,
  Pin,
  Placement,
  Wiring,
} from "./types";

// Function to convert DSN components to SMT pads and SourceComponents
function convertComponentsToSmtPadsAndSourceComponents(
  placement: Placement,
  library: Library,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = [];
  const imageMap = new Map<string, Image>();

  // Create a map of component names to images in the library
  library.images.forEach((image) => {
    imageMap.set(image.name, image);
  });

  placement.components.forEach((dsnComponent) => {
    const image = imageMap.get(dsnComponent.name);
    const componentId = uuidv4(); // Generate unique ID for each component

    // Convert pins to SMT pads
    if (image?.pins) {
      image.pins.forEach((pin: Pin) => {
        const padId = uuidv4(); // Unique ID for each pad

        // Parse width and height from padstack_name
        let width = 0.9; // Default width in mm
        let height = 0.95; // Default height in mm

        if (pin.padstack_name) {
          const dimensions = parsePadstackDimensions(pin.padstack_name);
          if (dimensions) {
            width = dimensions.width;
            height = dimensions.height;
          }
        }

        const pcbPad: AnyCircuitElement = {
          type: "pcb_smtpad",
          pcb_smtpad_id: padId,
          pcb_component_id: componentId,
          pcb_port_id: padId, // Use the same ID for the port
          shape: "rect", // Assuming rectangle pads, adjust based on actual shape
          x: (dsnComponent.place.x + pin.x) / 1000,
          y: Math.abs((dsnComponent.place.y + pin.y) / 1000), // Adjust the y coordinate to be positive
          width,
          height,
          layer: dsnComponent.place.side === "front" ? "top" : "bottom",
          port_hints: [pin.pin_number.toString()],
        };
        elements.push(pcbPad);
      });
    }

    // Add the source component as well
    const sourceComponent: {
      type: "source_component";
      ftype: "component";
      source_component_id: string;
      name: string;
      manufacturer_part_number: string;
    } = {
      type: "source_component",
      ftype: "component", // Could adjust based on component type (resistor, capacitor, etc.)
      source_component_id: `source_component_${dsnComponent.place.refdes}`,
      name: dsnComponent.place.refdes,
      manufacturer_part_number: dsnComponent.place.PN,
    };
    elements.push(sourceComponent);
  });

  return elements;
}

function parsePadstackDimensions(
  padstackName: string,
): { width: number; height: number } | null {
  // Match pattern: Pad_<width>x<height>_
  const match = padstackName.match(/Pad_(\d+)x(\d+)_/);
  if (match) {
    const widthUm = parseFloat(match[1]);
    const heightUm = parseFloat(match[2]);
    const widthMm = widthUm / 1000; // Convert micrometers to millimeters
    const heightMm = heightUm / 1000;
    return { width: widthMm, height: heightMm };
  } else {
    return null;
  }
}

// Function to convert DSN nets to SourceNets
function convertNetsToSourceNets(network: Network): SourceNet[] {
  return network.nets.map((dsnNet, index) => ({
    type: "source_net",
    source_net_id: `source_net_${index + 1}`,
    name: dsnNet.name,
    member_source_group_ids: [], // Add an empty array for member_source_group_ids
    member_source_component_ids: dsnNet.pins.map((pin) => {
      const [componentRefdes] = pin.split("-");
      return `source_component_${componentRefdes}`;
    }),
  }));
}

// Function to convert DSN wires to PCB traces
// Function to convert DSN wires to PCB traces
function convertWiresToPcbTraces(wiring: Wiring, network: Network): PCBTrace[] {
  const pcbTraces: PCBTrace[] = [];

  wiring.wires.forEach((dsnWire, index) => {
    const sourceNet = network.nets.find((net) => net.name === dsnWire.net);
    if (!sourceNet) return;

    const pcbTrace: PCBTrace = {
      type: "pcb_trace",
      pcb_trace_id: uuidv4(), // Generate unique trace ID
      source_trace_id: `net_${network.nets.indexOf(sourceNet) + 1}`,
      route_thickness_mode: "constant",
      should_round_corners: false,
      route: [],
    };

    // Convert DSN path coordinates to route points
    const pathCoords = dsnWire.path.coordinates;
    const width = dsnWire.path.width / 1000; // Convert width to millimeters
    const layer =
      dsnWire.path.layer === "F.Cu" ? "top" : ("bottom" as LayerRef);

    // Loop through the path coordinates and create points
    for (let i = 0; i < pathCoords.length; i += 2) {
      const point = {
        route_type: "wire" as const,
        x: pathCoords[i] / 1000,
        y: Math.abs(pathCoords[i + 1] / 1000), // Adjust y coordinate to positive
        width,
        layer,
      };
      pcbTrace.route.push(point);
    }

    pcbTraces.push(pcbTrace);
  });

  return pcbTraces;
}

// Function to convert DSN boundary to PCB board
function convertBoundaryToPcbBoard(boundary: Boundary): PCBBoard {
  const coordinates = boundary.path.coordinates;

  return {
    type: "pcb_board",
    pcb_board_id: uuidv4(), // Generate unique ID for the PCB board
    outline: coordinates.reduce((acc: { x: number; y: number }[], _, i) => {
      if (i % 2 === 0) {
        acc.push({
          x: coordinates[i] / 1000,
          y: Math.abs(coordinates[i + 1] / 1000), // Adjust y coordinate to positive
        });
      }
      return acc;
    }, []),
  };
}

// Main function to convert DSN PCB to Circuit JSON
export function dsnPcbToCircuitJson(pcb: PCB): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = [];

  // Convert components to SMT pads and Source Components
  elements.push(
    ...convertComponentsToSmtPadsAndSourceComponents(
      pcb.placement,
      pcb.library,
    ),
  );

  // Convert nets to SourceNets
  elements.push(...convertNetsToSourceNets(pcb.network));

  // Convert wires to PCB Traces
  elements.push(...convertWiresToPcbTraces(pcb.wiring, pcb.network));

  // Convert the boundary to PCB Board
  elements.push(convertBoundaryToPcbBoard(pcb.structure.boundary));

  return elements;
}
