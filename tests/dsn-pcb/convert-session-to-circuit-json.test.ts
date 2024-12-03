import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
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

test("convert session to circuit json", async () => {
  const debug = Debug("tscircuit:dsn-converter")
  const circuitJson = parseDsnToCircuitJson(pcbDsnFile)

  const pcbJson = parseDsnToDsnJson(pcbDsnFile) as DsnPcb
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    pcbJson,
    sessionJson,
  )

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
