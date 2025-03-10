import { Circuit } from "@tscircuit/core"
import { parseDsnToDsnJson, type DsnPcb, type DsnSession } from "lib"
import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  convertDsnSessionToCircuitJson,
  mergeDsnSessionIntoDsnPcb,
} from "lib"
// @ts-ignore
import sessionFile from "../assets/repro/thickness-of-trace.ses" with {
  type: "text",
}
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { PcbTrace, PcbTraceRoutePointWire } from "circuit-json"

test("circuit json thickness converted to dsn file", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <resistor resistance={1000} name="R1" footprint={"0402"} pcbX={-3} />
      <resistor resistance={1000} name="R2" footprint={"0402"} pcbX={3} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" thickness={0.3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()
  const source_trace = circuitJson.filter(
    (element) => element.type === "source_trace",
  )[0]
  expect(source_trace.min_trace_thickness).toBe(0.3)

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  const network = dsnJson.network.classes
  expect(network.length).toBe(2)

  const trace_width_300um = network.find((c) => c.name === "trace_width_300um")
  expect(trace_width_300um).toBeDefined()
  expect(trace_width_300um?.rule.width).toBe(300)

  const kicad_default = network.find((c) => c.name === "kicad_default")
  expect(kicad_default).toBeDefined()
  expect(kicad_default?.rule.width).toBe(150)
})

test("thickness of trace in dsn file to circuit json", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <resistor resistance={1000} name="R1" footprint={"0402"} pcbX={-3} />
      <resistor resistance={1000} name="R2" footprint={"0402"} pcbX={3} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" thickness={0.3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  const dsnSession = parseDsnToDsnJson(sessionFile) as DsnSession
  const dsnFile = convertCircuitJsonToDsnString(circuit.getCircuitJson())
  const dsnPcb = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJsonWithOutputTraces = convertDsnSessionToCircuitJson(
    dsnPcb,
    dsnSession,
  )

  const pcbTraces = circuitJsonWithOutputTraces.filter(
    (element) => element.type === "pcb_trace",
  )[0] as PcbTrace

  // console.dir(pcbTraces, { depth: null })
  expect((pcbTraces.route[0] as PcbTraceRoutePointWire).width).toBe(0.3)
  expect(
    convertCircuitJsonToPcbSvg(circuitJsonWithOutputTraces),
  ).toMatchSvgSnapshot(import.meta.path)
})
