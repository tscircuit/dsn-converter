import { expect, test } from "bun:test"
import { type DsnSession, parseDsnToDsnJson, stringifyDsnSession } from "lib"
// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}

test("stringify session file", () => {
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession

  // Test that we can parse the generated string back to the same structure
  expect(reparsed.filename).toBe(sessionJson.filename)
  expect(reparsed.placement.components).toHaveLength(
    sessionJson.placement.components.length,
  )
  expect(reparsed.routes.network_out.nets).toHaveLength(
    sessionJson.routes.network_out.nets.length,
  )

  // Test specific values
  const originalNet = sessionJson.routes.network_out.nets[0]
  const reparsedNet = reparsed.routes.network_out.nets[0]
  expect(reparsedNet.name).toBe(originalNet.name)
  expect(reparsedNet.wires).toHaveLength(originalNet.wires.length)
})

test("stringify session file preserves was_is mappings", () => {
  const sessionWithWasIs = `(session routed.ses
  (base_design board.dsn)
  (placement
    (resolution um 10)
  )
  (was_is
    (component U1 U1_RENAMED)
    (net "Net With Spaces" "Net_Renamed")
  )
  (routes
    (resolution um 10)
    (network_out)
  )
)`

  const sessionJson = parseDsnToDsnJson(sessionWithWasIs) as DsnSession
  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession

  expect(reparsed.was_is).toEqual([
    "(component U1 U1_RENAMED)",
    '(net "Net With Spaces" Net_Renamed)',
  ])
})
