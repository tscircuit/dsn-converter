import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { convertCircuitJsonToDsnString } from "lib"

test("repro-coordinates-10x-too-large-with-circuit", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-4}
        pcbY={0}
        supplierPartNumbers={{ jlcpcb: ["C25744"] }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={4}
        pcbY={0}
        supplierPartNumbers={{ jlcpcb: ["C25744"] }}
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const dsnString = convertCircuitJsonToDsnString(circuitJson as any)

  // EXPLANATION OF THE BUG:
  // The DSN file declares a resolution of 10 units per micrometer (um).
  // This means that for a physical coordinate of 4mm (4000um), the DSN coordinate
  // should be 40,000 (4000um * 10 units/um).
  //
  // EXPECTED RESULT:
  // The coordinate should be 40000.
  // Expected: (place pcb_component_1 40000 0 front 0 )

  // Verify resolution is 10
  expect(dsnString).toContain("(resolution um 10)")

  expect(dsnString).toContain("(place R1_source_component_0 -40000 0 front 0")
  expect(dsnString).toContain("(place R2_source_component_1 40000 0 front 0")
  expect(dsnString).toContain(
    "(path pcb 0  -100000 -100000 100000 -100000 100000 100000 -100000 100000 -100000 -100000)",
  )
})
