import { convertCircuitJsonToDsnString } from "./lib"
import threeSubcircuitCircuitConnectedToSamePorts from "./tests/assets/repro/three-subcircuit-connected-to-same-ports.json"

const dsnFile = convertCircuitJsonToDsnString(
  threeSubcircuitCircuitConnectedToSamePorts as any,
)
console.log(dsnFile)
