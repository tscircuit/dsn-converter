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

test("stringify session preserves library_out padstack shapes", () => {
  const sessionJson = parseDsnToDsnJson(`(session board.ses
    (base_design board.dsn)
    (placement
      (resolution um 10)
    )
    (was_is)
    (routes
      (resolution um 10)
      (parser
        (host_cad "freerouting")
        (host_version "1.0")
      )
      (library_out
        (padstack "MixedPadstack"
          (shape (circle F.Cu 200))
          (shape (rect F.Cu -100 -50 100 50))
          (shape (polygon B.Cu 0 -100 -100 100 -100 100 100 -100 100))
          (shape (path F.Cu 50 0 0 100 0))
          (attach off)
        )
      )
      (network_out)
    )
  )`) as DsnSession

  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession

  expect(reparsed.routes.library_out?.padstacks[0].shapes).toEqual(
    sessionJson.routes.library_out?.padstacks[0].shapes,
  )
})
