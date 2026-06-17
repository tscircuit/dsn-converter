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

test("stringify session preserves placement identifiers with spaces", () => {
  const sessionJson = parseDsnToDsnJson(`(session routed.ses
    (base_design board.dsn)
    (placement
      (resolution um 10)
      (component "USB Connector"
        (place "J 1" 1250 2500 front 90)
      )
    )
    (was_is)
    (routes
      (resolution um 10)
      (parser
        (host_cad "freerouting")
        (host_version "1.0")
      )
      (network_out)
    )
  )`) as DsnSession

  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  const component = reparsed.placement.components[0]
  const place = component.places[0]

  expect(component.name).toBe("USB Connector")
  expect(place.refdes).toBe("J 1")
  expect(place.x).toBe(1250)
  expect(place.y).toBe(2500)
  expect(place.side).toBe("front")
  expect(place.rotation).toBe(90)
})
