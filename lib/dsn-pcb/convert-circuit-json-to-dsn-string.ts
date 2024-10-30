import { convertCircuitJsonToDsnJson } from "./convert-circuit-json-to-dsn-json"
import { stringifyDsnJson } from "./stringify-dsn-json"

export const convertCircuitJsonToDsnString = (circuitJson: CircuitJson) => {
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  return stringifyDsnJson(dsnJson)
}
