import { fromTriangles } from "transformation-matrix"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "../types"
import { convertPadstacksToSmtPads } from "./convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./convert-wire-to-trace"

export function convertDsnJsonToCircuitJson(pcb: DsnPcb): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []

  // DSN space coordinates
  const dsnSpaceCoordinates = [
    { x: 148405, y: -105000 },
    { x: 156105, y: -105000 },
    { x: 156105, y: 100000 },
  ]

  // Circuit space coordinates
  const circuitSpaceCoordinates = [
    { x: -3.5, y: 0 },
    { x: 3.5, y: 0 },
    { x: 3.5, y: 10 },
  ]

  // Create the transformation matrix using the provided DSN and Circuit coordinates
  const transform = fromTriangles(dsnSpaceCoordinates, circuitSpaceCoordinates)

  // Add the board
  elements.push({
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    thickness: 1.4,
    num_layers: 4,
  })

  // Convert padstacks to SMT pads using the transformation matrix
  elements.push(...convertPadstacksToSmtPads(pcb, transform))

  // Convert wires to PCB traces using the transformation matrix
  if (pcb.wiring && pcb.network) {
    elements.push(
      ...convertWiresToPcbTraces(pcb.wiring, pcb.network, transform),
    )
  }

  return elements
}
