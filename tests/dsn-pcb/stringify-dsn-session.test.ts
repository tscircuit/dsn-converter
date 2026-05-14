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

test("stringify session preserves network vias", () => {
  const sessionWithVia = `(session routed
  (base_design routed)
  (placement
    (resolution um 10)
  )
  (routes
    (resolution um 10)
    (parser
      (host_cad "KiCad's Pcbnew")
      (host_version "8.0")
    )
    (library_out
      (padstack "Via[0-1]_600:300_um"
        (shape
          (circle F.Cu 600 0 0)
        )
        (shape
          (circle B.Cu 600 0 0)
        )
        (attach off)
      )
    )
    (network_out
      (net "N1"
        (wire
          (path F.Cu 200
            0 0
            1250 -2500
          )
        )
        (via "Via[0-1]_600:300_um" 1250 -2500)
      )
    )
  )
)`

  const parsed = parseDsnToDsnJson(sessionWithVia) as DsnSession
  const stringified = stringifyDsnSession(parsed)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession

  expect(stringified).toContain('(via "Via[0-1]_600:300_um" 1250 -2500)')
  expect(reparsed.routes.network_out.nets[0].vias).toEqual(
    parsed.routes.network_out.nets[0].vias,
  )
})
