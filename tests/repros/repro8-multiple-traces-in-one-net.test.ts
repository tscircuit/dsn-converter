import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToCircuitJson } from "lib"
import threeSubcircuitCircuitConnectedToSamePorts from "../assets/repro/three-subcircuit-connected-to-same-ports.json"
import { su } from "@tscircuit/soup-util"

test("circuit json -> dsn -> circuit json", async () => {
  const dsnFile = convertCircuitJsonToDsnString(threeSubcircuitCircuitConnectedToSamePorts as any)
  const circuitJson = parseDsnToCircuitJson(dsnFile)

  const source_trace = su(circuitJson).source_trace.list()
  expect(source_trace.length).toBe(2)

  const pcb_trace = su(circuitJson).pcb_trace.list()
  expect(pcb_trace.length).toBe(1)
  expect(pcb_trace[0].source_trace_id).toBe(source_trace[0].source_trace_id)

  // The other source_trace is having multiple connected_source_port_ids
  expect(source_trace[1].connected_source_port_ids.length).toBe(3)
})
