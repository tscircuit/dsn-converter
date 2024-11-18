import { fromTriangles, scale, applyToPoint } from "transformation-matrix"

import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnPcb } from "../types"
import { convertPadstacksToSmtPads } from "./convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./convert-wire-to-trace"
import { pairs } from "lib/utils/pairs"

export function convertDsnPcbToCircuitJson(
  dsnPcb: DsnPcb,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []

  // TODO use pcb.resolution.unit and pcb.resolution.value
  const transformUmToMm = scale(1 / 1000)

  // Add the board
  // You must use the dsnPcb.boundary to get the center, width and height
  const board: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    thickness: 1.4,
    num_layers: 4,
  }
  if (dsnPcb.structure.boundary.path) {
    const boundaryPath = pairs(dsnPcb.structure.boundary.path.coordinates)
    const maxX = Math.max(...boundaryPath.map(([x]) => x))
    const minX = Math.min(...boundaryPath.map(([x]) => x))
    const maxY = Math.max(...boundaryPath.map(([, y]) => y))
    const minY = Math.min(...boundaryPath.map(([, y]) => y))
    board.center = applyToPoint(transformUmToMm, {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2,
    })
    board.width = (maxX - minX) * transformUmToMm.a
    board.height = (maxY - minY) * transformUmToMm.a
  } else {
    throw new Error(
      `Couldn't read DSN boundary, add support for dsnPcb.structure.boundary["${Object.keys(dsnPcb.structure.boundary).join(",")}"]`,
    )
  }

  elements.push(board)

  // Convert padstacks to SMT pads using the transformation matrix
  elements.push(...convertPadstacksToSmtPads(dsnPcb, transformUmToMm))

  // Convert wires to PCB traces using the transformation matrix
  if (dsnPcb.wiring && dsnPcb.network) {
    elements.push(
      ...convertWiresToPcbTraces(
        dsnPcb.wiring,
        dsnPcb.network,
        transformUmToMm,
      ),
    )
  }

  return elements
}
