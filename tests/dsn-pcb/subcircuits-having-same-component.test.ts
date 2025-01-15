import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnString,
  type DsnPcb
} from "lib"
import inputCircuitFile from "../assets/repro/subcircuits-same-components.json"
import type { AnyCircuitElement } from "circuit-json"

test("convert circuit json to dsn pcb", async () => {
  const circuitJson = inputCircuitFile as AnyCircuitElement[]
  const dsnPcb = convertCircuitJsonToDsnString(circuitJson)

  await Bun.write("output.dsn", dsnPcb)
})
