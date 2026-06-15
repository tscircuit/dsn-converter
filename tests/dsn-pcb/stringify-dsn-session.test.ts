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

test("stringify session preserves parser options", () => {
  const session = {
    is_dsn_session: true,
    filename: "test.ses",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: "'",
        space_in_quoted_tokens: "on",
        host_cad: "KiCad",
        host_version: "9.0.2",
      },
      network_out: {
        nets: [],
      },
    },
  } as DsnSession

  const stringified = stringifyDsnSession(session)

  expect(stringified).toContain('(string_quote "\'")')
  expect(stringified).toContain('(space_in_quoted_tokens "on")')
})
