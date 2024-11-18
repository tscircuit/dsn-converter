import { scale, applyToPoint } from "transformation-matrix"

import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnSession } from "../types"
import { convertPadstacksToSmtPads } from "./convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./convert-wire-to-trace"
import { pairs } from "lib/utils/pairs"

export function convertDsnSessionToCircuitJson(
  dsnSession: DsnSession,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []

  const transformUmToMm = scale(1 / 1000)

  const board: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    thickness: 1.4,
    num_layers: 4,
  }

  // TODO rest of the function...

  return elements
}
