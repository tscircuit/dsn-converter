import type { AnyCircuitElement } from "circuit-json"
import { convertDsnPcbToCircuitJson } from "./convert-dsn-pcb-to-circuit-json"
import { parseDsnToDsnJson } from "./parse-dsn-to-dsn-json"
import type { DsnPcb } from "../types"

export const parseDsnToCircuitJson = (
  dsnString: string,
): AnyCircuitElement[] => {
  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  return circuitJson
}
