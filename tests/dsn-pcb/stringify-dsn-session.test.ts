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

test("preserves session routes resolution and parser metadata", () => {
  const sessionJson = parseDsnToDsnJson(`(session metadata-test
    (base_design metadata-test)
    (placement
      (resolution mil 25)
    )
    (routes
      (resolution mil 25)
      (parser
        (string_quote "'")
        (space_in_quoted_tokens off)
        (host_cad "freerouting")
        (host_version "2.1.0")
      )
      (network_out)
    )
  )`) as DsnSession

  expect(sessionJson.routes.resolution).toEqual({ unit: "mil", value: 25 })
  expect(sessionJson.routes.parser).toEqual({
    string_quote: "'",
    space_in_quoted_tokens: "off",
    host_cad: "freerouting",
    host_version: "2.1.0",
  })

  const reparsed = parseDsnToDsnJson(
    stringifyDsnSession(sessionJson),
  ) as DsnSession

  expect(reparsed.routes.resolution).toEqual(sessionJson.routes.resolution)
  expect(reparsed.routes.parser.host_cad).toBe(
    sessionJson.routes.parser.host_cad,
  )
  expect(reparsed.routes.parser.host_version).toBe(
    sessionJson.routes.parser.host_version,
  )
})
