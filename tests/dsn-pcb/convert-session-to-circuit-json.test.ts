import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import {
  parseDsnToDsnJson,
  convertDsnSessionToCircuitJson,
  type DsnPcb,
  type DsnSession,
} from "lib"

// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}
// @ts-ignore
import pcbDsnFile from "../assets/freerouting-sessions/circuit1.dsn" with {
  type: "text",
}

test("convert session to circuit json", async () => {
  const pcbJson = parseDsnToDsnJson(pcbDsnFile) as DsnPcb
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  const circuitJson = convertDsnSessionToCircuitJson(pcbJson, sessionJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
