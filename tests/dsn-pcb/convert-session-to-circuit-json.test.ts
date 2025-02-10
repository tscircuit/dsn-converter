import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { expect, test } from "bun:test"
import {
  parseDsnToDsnJson,
  convertDsnSessionToCircuitJson,
  type DsnPcb,
  type DsnSession,
  parseDsnToCircuitJson,
  stringifyDsnSession,
} from "lib"

// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}
// @ts-ignore
import pcbDsnFile from "../assets/freerouting-sessions/circuit1.dsn" with {
  type: "text",
}
import { circuitJsonToTable } from "../debug-utils/circuit-json-to-table.ts"
import { sessionFileToTable } from "../debug-utils/index.ts"
import Debug from "debug"
import { su } from "@tscircuit/soup-util"

test("convert session to circuit json", async () => {
  const debug = Debug("tscircuit:dsn-converter")
  const circuitJson = parseDsnToCircuitJson(pcbDsnFile)

  const pcbJson = parseDsnToDsnJson(pcbDsnFile) as DsnPcb
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    pcbJson,
    sessionJson,
  )

  const pcb_traces = su(circuitJsonFromSession).pcb_trace.list()
  const pcb_traces_by_id = [
    ...new Set(pcb_traces.map((trace) => trace.pcb_trace_id)),
  ]

  expect(pcb_traces_by_id.length).toBe(3)

  if (debug.enabled) {
    circuitJsonToTable(
      circuitJson,
      "../dsn-pcb/dsn-files-stages/__stage-1-dsn-circuit-json.md",
      "Stage 1: dsn circuit json",
    )
    sessionFileToTable(
      stringifyDsnSession(sessionJson),
      "../dsn-pcb/dsn-files-stages/__stage-2-dsn-session.md",
      "Stage 2: dsn session",
    )
    circuitJsonToTable(
      circuitJsonFromSession,
      "../dsn-pcb/dsn-files-stages/__stage-3-dsn-session-to-circuit-json.md",
      "Circuit Json from Session",
    )
  }

  expect(convertCircuitJsonToPcbSvg(circuitJsonFromSession)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
