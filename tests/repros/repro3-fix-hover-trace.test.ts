import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, convertDsnJsonToCircuitJson, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/trace-id-fix-circuit.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("check that on hover all the trace and connected pads are correctly linked", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  // pcb_trace source_trace_id should match the source_trace_id of the source_trace
  const pcb_trace = circuitJson2.find((e) => e.type === "pcb_trace")
  const source_trace = circuitJson2.find((e) => e.type === "source_trace")

  expect(pcb_trace?.source_trace_id && source_trace?.source_trace_id).toBeTruthy()
  expect(pcb_trace!.source_trace_id).toBe(source_trace!.source_trace_id)

  // Check that pcb_smtpad's pcb_port_id matches the pattern of corresponding source_port's source_port_id
  const pcb_smtpad = circuitJson2.find((e) => e.type === "pcb_smtpad")
  const source_port = circuitJson2.find((e) => e.type === "source_port")

  expect(pcb_smtpad?.pcb_port_id && source_port?.source_port_id).toBeTruthy()
  
  // Type assertion to tell TypeScript that pcb_smtpad has pcb_port_id
  const expected_source_port_id = (pcb_smtpad as { pcb_port_id: string }).pcb_port_id.replace("pcb_port_", "source_port_")
  expect(expected_source_port_id).toBe(source_port!.source_port_id)
})
