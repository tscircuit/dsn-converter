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

test("stringifies session vias as via records", () => {
  const sessionJson: DsnSession = {
    is_dsn_session: true,
    filename: "via-session",
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
        host_version: "1",
      },
      library_out: {
        images: [],
        padstacks: [
          {
            name: "Via[0-1]_600:300_um",
            shapes: [],
            attach: "off",
          },
        ],
      },
      network_out: {
        nets: [
          {
            name: "Net-(R1-Pad1)",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 2000,
                  coordinates: [0, 0, 10000, 0],
                },
                net: "Net-(R1-Pad1)",
                type: "route",
              },
              {
                path: {
                  layer: "F.Cu",
                  width: 600,
                  coordinates: [10000, 0],
                },
                net: "Net-(R1-Pad1)",
                type: "via",
              },
            ],
            vias: [{ x: 20000, y: 0 }],
          },
        ],
      },
    },
  }

  const stringified = stringifyDsnSession(sessionJson)
  expect(stringified).toContain('(via "Via[0-1]_600:300_um" 10000 0)')
  expect(stringified).toContain('(via "Via[0-1]_600:300_um" 20000 0)')

  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  const reparsedNet = reparsed.routes.network_out.nets[0]
  expect(reparsedNet.wires).toHaveLength(1)
  expect(reparsedNet.vias).toEqual([
    { x: 10000, y: 0 },
    { x: 20000, y: 0 },
  ])
})
