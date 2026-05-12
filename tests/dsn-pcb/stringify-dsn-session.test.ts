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

test("stringify session file preserves library_out padstack holes", () => {
  const sessionJson: DsnSession = {
    is_dsn_session: true,
    filename: "hole-test.ses",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: '"',
        space_in_quoted_tokens: "on",
        host_cad: "test",
        host_version: "test",
      },
      library_out: {
        images: [],
        padstacks: [
          {
            name: "Via[0-1]_600:300_um",
            shapes: [
              { shapeType: "circle", layer: "F.Cu", diameter: 600 },
              { shapeType: "circle", layer: "B.Cu", diameter: 600 },
            ],
            hole: { shape: "circle", diameter: 300 },
            attach: "off",
          },
        ],
      },
      network_out: { nets: [] },
    },
  }

  const stringified = stringifyDsnSession(sessionJson)
  expect(stringified).toContain("(hole (circle 300))")

  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  expect(reparsed.routes.library_out?.padstacks[0].hole).toEqual({
    shape: "circle",
    diameter: 300,
  })
})
