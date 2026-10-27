import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { su } from "@tscircuit/soup-util"
import type { AnyCircuitElement } from "circuit-json"
import {
  type DsnPcb,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

test("pcbRotation 0deg vs 180deg preserves distinct rotated pin positions", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX={-2}
        pcbRotation="180deg"
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX={2}
        pcbRotation="0deg"
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  const circuitJsonBefore =
    (await circuit.getCircuitJson()) as AnyCircuitElement[]
  const dsnString = convertCircuitJsonToDsnString(circuitJsonBefore)
  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const circuitJsonAfter = convertDsnPcbToCircuitJson(dsnJson)

  const afterPads = su(circuitJsonAfter).pcb_smtpad.list()
  const r1Pad1 = afterPads.find(
    (p) => p.pcb_component_id?.includes("R1_") && p.port_hints?.includes("1"),
  )
  const r1Pad2 = afterPads.find(
    (p) => p.pcb_component_id?.includes("R1_") && p.port_hints?.includes("2"),
  )
  const r2Pad1 = afterPads.find(
    (p) => p.pcb_component_id?.includes("R2_") && p.port_hints?.includes("1"),
  )
  const r2Pad2 = afterPads.find(
    (p) => p.pcb_component_id?.includes("R2_") && p.port_hints?.includes("2"),
  )

  expect(r1Pad1).toBeDefined()
  expect(r1Pad2).toBeDefined()
  expect(r2Pad1).toBeDefined()
  expect(r2Pad2).toBeDefined()

  if (
    r1Pad1 &&
    "x" in r1Pad1 &&
    r1Pad2 &&
    "x" in r1Pad2 &&
    r2Pad1 &&
    "x" in r2Pad1 &&
    r2Pad2 &&
    "x" in r2Pad2
  ) {
    // R1 is rotated 180deg (center x = -2): Pad1 is on the right (-1.49), Pad2 is on the left (-2.51)
    expect(r1Pad1.x).toBeGreaterThan(r1Pad2.x)
    // R2 is at 0deg (center x = 2): Pad1 is on the left (1.49), Pad2 is on the right (2.51)
    expect(r2Pad1.x).toBeLessThan(r2Pad2.x)
  }
})
