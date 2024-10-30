import type { AnyCircuitElement } from "circuit-json"
import { parseDsnToDsnJson } from "./parse-dsn-to-dsn-json"
import { dsnJsonToCircuitJson } from "./dsn-json-to-circuit-json"

export const parseDsnToCircuitJson = (
  dsnString: string,
): AnyCircuitElement[] => {
  const dsnJson = parseDsnToDsnJson(dsnString)
  const circuitJson = dsnJsonToCircuitJson(dsnJson)
  return circuitJson
}
