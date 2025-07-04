import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"
import { stringifyDsnJson } from "./stringify-dsn-json"

export const convertCircuitJsonToDsnString = (
  circuitJson: AnyCircuitElement[],
  options: {
    traceClearance?: number
  } = {},
) => {
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson, options)
  return stringifyDsnJson(dsnJson)
}
