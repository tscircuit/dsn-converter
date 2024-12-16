import { fromTriangles, scale, applyToPoint } from "transformation-matrix"

import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnPcb, DsnSession } from "../types"
import { convertPadstacksToSmtPads } from "./dsn-component-converters/convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./dsn-component-converters/convert-wires-to-traces"
import { pairs } from "lib/utils/pairs"
import { convertDsnPcbToCircuitJson } from "./convert-dsn-pcb-to-circuit-json"
import { convertDsnSessionToCircuitJson } from "./convert-dsn-session-to-circuit-json"

/**
 * @deprecated use convertDsnPcbToCircuitJson instead
 */
export function convertDsnJsonToCircuitJson(
  dsnPcb: DsnPcb,
): AnyCircuitElement[] {
  return convertDsnPcbToCircuitJson(dsnPcb)
}
