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

test("preserves session library_out image descriptors", () => {
  const sessionJson = parseDsnToDsnJson(`(session image-test
  (base_design image-test)
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
      (image "Connector"
        (outline (path F.Cu 0 0 0 100 0 100 100))
        (pin ViaPad 1 10 20)
        (pin ViaPad 2 30 40)
      )
      (padstack "ViaPad"
        (shape (circle F.Cu 600))
        (attach off)
      )
    )
    (network_out)
  )
)`) as DsnSession

  const reparsed = parseDsnToDsnJson(
    stringifyDsnSession(sessionJson),
  ) as DsnSession

  expect(reparsed.routes.library_out?.images).toEqual(
    sessionJson.routes.library_out?.images,
  )
})
