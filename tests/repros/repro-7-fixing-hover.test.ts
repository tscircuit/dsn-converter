import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  convertDsnSessionToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

import circuitJson from "../assets/repro/input_circuit.json"
// @ts-ignore
import outputSesFile from "../assets/repro/output_ses.ses" with { type: "text" }

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, DsnSession } from "lib"

test("fixing hover for the motor driver", async () => {
  const dsnPcb = convertCircuitJsonToDsnJson(circuitJson as AnyCircuitElement[])
  const sessionJson = parseDsnToDsnJson(outputSesFile) as DsnSession

  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    dsnPcb,
    sessionJson,
  )

  const outputPcbTraces = circuitJsonFromSession.filter(
    (element) => element.type === "pcb_trace",
  )

  const newCircuitJson = [...circuitJson, ...outputPcbTraces]

  Bun.write("output-with-traces.json", JSON.stringify(newCircuitJson, null, 2))
})
