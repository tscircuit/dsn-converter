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

test("preserves session was_is pin mappings", () => {
  const sessionJson = parseDsnToDsnJson(`(session routed-board
    (base_design original-board)
    (placement
      (resolution um 10)
    )
    (was_is
      (pins R1-1 R1-Pad1)
      (pins U1-2 U1-Pad2)
    )
    (routes
      (resolution um 10)
      (parser
        (host_cad "Freerouting")
        (host_version "1.9.0")
      )
      (network_out)
    )
  )`) as DsnSession

  expect(sessionJson.was_is).toEqual([
    { type: "pins", from: "R1-1", to: "R1-Pad1" },
    { type: "pins", from: "U1-2", to: "U1-Pad2" },
  ])

  const reparsed = parseDsnToDsnJson(
    stringifyDsnSession(sessionJson),
  ) as DsnSession

  expect(reparsed.was_is).toEqual(sessionJson.was_is)
})
