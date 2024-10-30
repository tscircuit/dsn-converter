import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"
import { stringifyDsnJson } from "./stringify-dsn-json"

export const convertCircuitJsonToDsnString = (
  circuitJson: AnyCircuitElement[],
) => {
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  return stringifyDsnJson(dsnJson)
}
