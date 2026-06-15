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

test("preserves non-circle session library_out padstack shapes", () => {
  const sessionJson = parseDsnToDsnJson(`(session shape-test
  (base_design shape-test)
  (placement
    (resolution um 10)
  )
  (was_is)
  (routes
    (resolution um 10)
    (parser
      (host_cad "KiCad's Pcbnew")
      (host_version "9.0")
    )
    (library_out
      (padstack "MixedPad"
        (shape (polygon F.Cu 0 0 0 100 0 100 100 0 100))
        (shape (rect B.Cu -50 -25 50 25))
        (shape (path Inner1.Cu 20 0 0 100 0))
        (attach off)
      )
    )
    (network_out)
  )
)`) as DsnSession

  const reparsed = parseDsnToDsnJson(
    stringifyDsnSession(sessionJson),
  ) as DsnSession

  expect(reparsed.routes.library_out?.padstacks[0].shapes).toEqual(
    sessionJson.routes.library_out?.padstacks[0].shapes,
  )
})
