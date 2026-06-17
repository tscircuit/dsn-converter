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

test("stringify session preserves network_out wire metadata", () => {
  const sessionJson = parseDsnToDsnJson(`(session routed.ses
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
      (network_out
        (net "Net 1"
          (wire
            (path F.Cu 200
              0 0 1000 0
            )
            (clearance_class "tight class")
            (type protect)
          )
        )
      )
    )
  )`) as DsnSession

  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  const wire = reparsed.routes.network_out.nets[0].wires[0]

  expect(wire.path).toEqual({
    layer: "F.Cu",
    width: 200,
    coordinates: [0, 0, 1000, 0],
  })
  expect(wire.clearance_class).toBe("tight class")
  expect(wire.type).toBe("protect")
})
