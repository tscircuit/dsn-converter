import { applyToPoint, fromTriangles, scale } from "transformation-matrix"

import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import { pairs } from "lib/utils/pairs"
import type { DsnPcb, DsnSession } from "../types"
import { convertDsnPcbToCircuitJson } from "./convert-dsn-pcb-to-circuit-json"
import { convertDsnSessionToCircuitJson } from "./convert-dsn-session-to-circuit-json"
import { convertPadstacksToSmtPads } from "./dsn-component-converters/convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./dsn-component-converters/convert-wires-to-traces"

/**
 * @deprecated use convertDsnPcbToCircuitJson instead
 */
export function convertDsnJsonToCircuitJson(
  dsnPcb: DsnPcb,
): AnyCircuitElement[] {
  return convertDsnPcbToCircuitJson(dsnPcb)
}
