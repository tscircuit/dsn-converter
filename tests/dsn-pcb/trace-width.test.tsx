import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToCircuitJson, parseDsnToDsnJson } from "lib"
import { Circuit } from "@tscircuit/core"
import {su} from "@tscircuit/soup-util"

test("circuit json to dsn file", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={"100mm"} height={"100mm"}>
      <resistor
        name="R1"
        resistance={1000}
        pcbX={2}
        pcbY={0}
        footprint={"0402"}
      />
      <resistor
        name="R2"
        resistance={1000}
        pcbX={-2}
        pcbY={0}
        footprint={"0402"}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  const ciruciJson = circuit.getCircuitJson()
  const dsnJson = convertCircuitJsonToDsnString(ciruciJson)
  const dsnFile = parseDsnToDsnJson(dsnJson)

  const convertingBackToCircuitJson = parseDsnToCircuitJson(dsnJson)

  const pcb_trace = su(convertingBackToCircuitJson).pcb_trace.list()

  expect(pcb_trace[0].trace_length).toBe(0.16)
})
