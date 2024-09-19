import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

import type {
  AnyCircuitElement,
  LayerRef,
  PCBBoard,
  PCBTrace,
} from "@tscircuit/soup";

import type { Boundary, Image, Network, PCB, Wiring } from "./types";

// Function to convert padstacks to SMT pads
function convertPadstacksToSmtPads(pcb: PCB): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = [];
  const { padstacks, images } = pcb.library;
  const imageMap = new Map<string, Image>();

  // Create a map of image names to images
  images.forEach((image) => {
    imageMap.set(image.name, image);
  });

  // Loop through each padstack
  padstacks.forEach((padstack) => {
    const padstackName = padstack.name;

    // Find all pins in images that use this padstack
    images.forEach((image) => {
      const componentName = image.name; // Use image name as component ID
      const componentId = componentName; // For consistency

      const placementComponent = pcb.placement.components.find(
        (comp) => comp.name === componentName,
      );

      if (!placementComponent) return; // If component not placed, skip

      const { x: compX, y: compY, side } = placementComponent.place;

      // Find pins in this image that use the current padstack
      image.pins.forEach((pin) => {
        if (pin.padstack_name === padstackName) {
          // Parse width and height from padstack name
          const dimensions = parsePadstackDimensions(padstackName);
          let width = 0.9; // Default width in mm
          let height = 0.95; // Default height in mm

          if (dimensions) {
            width = dimensions.width;
            height = dimensions.height;
          }

          // Create pcb_smtpad
          const pcbPad: AnyCircuitElement = {
            type: "pcb_smtpad",
            pcb_smtpad_id: `${padstackName}_${pin.pin_number}`, // Unique ID
            pcb_component_id: componentId,
            pcb_port_id: `${padstackName}_${pin.pin_number}`, // Use padstack_name and pin_number as port ID
            shape: "rect", // Adjust based on actual shape if necessary
            x: (compX + pin.x) / 1000,
            y: Math.abs((compY + pin.y) / 1000), // Adjust y coordinate to positive
            width,
            height,
            layer: side === "front" ? "top" : ("bottom" as LayerRef),
            port_hints: [pin.pin_number.toString()],
          };

          elements.push(pcbPad);
        }
      });
    });
  });

  return elements;
}

// Function to parse padstack dimensions from the padstack name
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

// Function to convert DSN wires to PCB traces
function convertWiresToPcbTraces(wiring: Wiring, network: Network): PCBTrace[] {
  const pcbTraces: PCBTrace[] = [];

  wiring.wires.forEach((dsnWire) => {
    const sourceNet = network.nets.find((net) => net.name === dsnWire.net);
    if (!sourceNet) return;

    const pcbTrace: PCBTrace = {
      type: "pcb_trace",
      pcb_trace_id: uuidv4(), // Generate unique trace ID
      source_trace_id: sourceNet.name,
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

// Function to convert PCB JSON to Circuit JSON
export function pcbJsonToCircuitJson(pcb: PCB): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = [];

  // Convert padstacks to SMT pads
  elements.push(...convertPadstacksToSmtPads(pcb));

  // Convert wires to PCB Traces
  elements.push(...convertWiresToPcbTraces(pcb.wiring, pcb.network));

  // Convert the boundary to PCB Board
  elements.push(convertBoundaryToPcbBoard(pcb.structure.boundary));

  return elements;
}