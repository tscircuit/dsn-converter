import { scale, applyToPoint } from "transformation-matrix"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnSession } from "../types"
import { convertWiresToPcbTraces } from "./convert-wire-to-trace"

export function convertDsnSessionToCircuitJson(
  dsnSession: DsnSession,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const transformUmToMm = scale(1 / 1000)
  const transformMmToUm = scale(1000)

  // Add a default board
  const board: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 100,
    height: 100,
    thickness: 1.4,
    num_layers: 4,
  }
  elements.push(board)

  // Process components to create SMT pads
  for (const component of dsnSession.placement.components) {
    const { place } = component
    const padId = `${place.refdes}_pad1`

    // Convert coordinates using transformation matrix
    const { x: circuitX, y: circuitY } = applyToPoint(transformUmToMm, {
      x: place.x,
      y: place.y,
    })

    // Create an SMT pad for each component
    const pcbPad: AnyCircuitElement = {
      type: "pcb_smtpad",
      pcb_smtpad_id: padId,
      pcb_component_id: place.refdes,
      pcb_port_id: padId,
      shape: "rect",
      x: circuitX,
      y: circuitY,
      width: 0.6, // Default width in mm
      height: 0.6, // Default height in mm
      layer: place.side === "front" ? "top" : "bottom",
      port_hints: ["1"],
    }
    elements.push(pcbPad)
  }

  // Convert wires to PCB traces
  if (dsnSession.routes.network_out.nets) {
    for (const net of dsnSession.routes.network_out.nets) {
      elements.push(
        ...convertWiresToPcbTraces(
          { wires: net.wires },
          { nets: [{ name: net.name, pins: [] }], classes: [] },
          transformUmToMm,
        ),
      )
    }
  }

  return elements
}
