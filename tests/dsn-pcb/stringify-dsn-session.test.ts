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

test("stringify session parser quote metadata", () => {
  const sessionJson: DsnSession = {
    is_dsn_session: true,
    filename: "session.ses",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: "'",
        space_in_quoted_tokens: "off",
        host_cad: "Custom CAD",
        host_version: "1.2.3",
      },
      library_out: {
        images: [],
        padstacks: [],
      },
      network_out: {
        nets: [],
      },
    },
  }

  const stringified = stringifyDsnSession(sessionJson)

  expect(stringified).toContain("(string_quote ')")
  expect(stringified).toContain("(space_in_quoted_tokens off)")
  expect(stringified).toContain('(host_cad "Custom CAD")')
  expect(stringified).toContain('(host_version "1.2.3")')
})
