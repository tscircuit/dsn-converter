import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import type { AnyCircuitElement, SourceTrace } from "circuit-json"
import { convertCircuitJsonToDsnJson, convertDsnJsonToCircuitJson } from "lib"

test("subcircuit traces connected by outer trace merge into a single DSN net without duplicate pin assignments", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit name="S1">
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={3}
          pcbX={3}
          pcbY={2}
        />
        <trace from=".R1 .pin1" to=".R2 .pin2" />
      </subcircuit>
      <subcircuit name="S2">
        <capacitor
          capacitance="1000pF"
          footprint="0603"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".C1 .pin1" to=".C1 .pin2" />
      </subcircuit>
      <trace from=".S1 .R1 .pin1" to=".S2 .C1 .pin1" />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson() as AnyCircuitElement[]
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  const connectedNets = dsnJson.network.nets.filter(
    (net) => !net.name.startsWith("unconnected-"),
  )
  expect(connectedNets).toHaveLength(1)
  expect(connectedNets[0].pins.sort()).toEqual([
    "C1_source_component_2-1",
    "C1_source_component_2-2",
    "R1_source_component_0-1",
    "R2_source_component_1-2",
  ])

  const roundtripCircuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const roundtripTraces = roundtripCircuitJson.filter(
    (el): el is SourceTrace => el.type === "source_trace",
  )
  expect(roundtripTraces).toHaveLength(1)
  expect(roundtripTraces[0].connected_source_port_ids).toHaveLength(4)
})
