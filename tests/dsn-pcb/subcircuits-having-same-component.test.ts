import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, convertCircuitJsonToDsnJson } from "lib"
import inputCircuitFile from "../assets/repro/subcircuits-same-components.json"
import type { AnyCircuitElement } from "circuit-json"

test("convert circuit json to dsn pcb", async () => {
  const circuitJson = inputCircuitFile as AnyCircuitElement[]
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.network.nets.length).toBe(6)

  const net1Count = dsnJson.network.nets.filter((net) =>
    net.name.startsWith("NET1"),
  ).length
  expect(net1Count).toBe(2)
})
