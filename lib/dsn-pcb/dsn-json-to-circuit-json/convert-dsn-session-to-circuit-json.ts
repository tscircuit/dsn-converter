import { scale, applyToPoint } from "transformation-matrix"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnSession } from "../types"
import { convertWiresToPcbTraces } from "./convert-wire-to-trace"

export function convertDsnSessionToCircuitJson(
  dsnSession: DsnSession,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []
  const transformUmToMm = scale(1 / 1000)

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
