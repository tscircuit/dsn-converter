import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnJson,
  convertDsnSessionToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

import circuitJson from "../assets/repro/motor-driver-breakout-circuit.json"
// @ts-ignore
import outputSesFile from "../assets/repro/output_motor.ses" with {
  type: "text",
}

import type { AnyCircuitElement } from "circuit-json"
import type { DsnSession } from "lib"
import { su } from "@tscircuit/soup-util"

test("motor driver circuit with hover", async () => {
  const dsnPcb = convertCircuitJsonToDsnJson(circuitJson as AnyCircuitElement[])
  const sessionJson = parseDsnToDsnJson(outputSesFile) as DsnSession

  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    dsnPcb,
    sessionJson,
    circuitJson as AnyCircuitElement[],
  )

  const outputPcbTraces = circuitJsonFromSession.filter(
    (element) => element.type === "pcb_trace",
  )

  const newCircuitJson = [...circuitJson, ...outputPcbTraces]

  const pcbTraces = su(newCircuitJson as AnyCircuitElement[]).pcb_trace.list()
  const sourceTraceIds = pcbTraces.map((trace) =>
    parseInt(trace.source_trace_id?.replace("source_trace_", "") ?? "0"),
  )

  expect(pcbTraces.length).toBe(67)
  expect(sourceTraceIds.every((id) => id >= 0 && id <= 22)).toBe(true)

  // Checking the proper linkage of source traces to source ports
  expect(sourceTraceIds.filter((id) => id === 17).length).toBe(2)
  expect(sourceTraceIds.filter((id) => id === 5).length).toBe(21)
  expect(sourceTraceIds.filter((id) => id === 4).length).toBe(5)
  expect(sourceTraceIds.filter((id) => id === 10).length).toBe(6)
  expect(sourceTraceIds.filter((id) => id === 0).length).toBe(11)
})
