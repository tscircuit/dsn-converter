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
  const session = parseDsnToDsnJson(`
    (session test.ses
      (placement
        (resolution um 10)
      )
      (routes
        (resolution um 10)
        (network_out
          (net "N1"
            (via "Via[0-1]_800:400_um" 25 50)
          )
        )
      )
    )
  `) as DsnSession

  const stringified = stringifyDsnSession(session)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  const via = reparsed.routes.network_out.nets[0].vias?.[0]

  expect(via?.padstack_name).toBe("Via[0-1]_800:400_um")
  expect(via?.x).toBe(25)
  expect(via?.y).toBe(50)
})
