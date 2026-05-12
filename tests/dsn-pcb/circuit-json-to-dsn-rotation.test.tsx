import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("circuit json component rotation is preserved in dsn placement", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbRotation="180deg"
      />
    </board>,
  )

  await circuit.render()

  const dsnJson = convertCircuitJsonToDsnJson(
    circuit.getCircuitJson() as AnyCircuitElement[],
  )
  const place = dsnJson.placement.components
    .flatMap((component) => component.places)
    .find((candidate) => candidate.refdes.startsWith("R1_"))

  expect(place?.rotation).toBe(180)
})
