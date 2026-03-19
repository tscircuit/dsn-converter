import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "../types"
import { convertDsnJsonToCircuitJson } from "./convert-dsn-json-to-circuit-json"
import { parseDsnToDsnJson } from "./parse-dsn-to-dsn-json"

export const parseDsnToCircuitJson = (
  dsnString: string,
): AnyCircuitElement[] => {
  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  return circuitJson
}
