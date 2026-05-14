import { expect, test } from "bun:test"
import { type DsnSession, parseDsnToDsnJson, stringifyDsnSession } from "lib"

test("preserves session placement status descriptors", () => {
  const sessionJson = parseDsnToDsnJson(`(session routed-board
  (base_design board.dsn)
  (placement
    (resolution um 10)
    (component R_0603
      (place R1 100 200 front 0 (status added))
      (place R2 300 400 back 90 (status substituted))
    )
  )
  (routes
    (resolution um 10)
    (parser
      (host_cad "Freerouting")
      (host_version "1.9.0")
    )
    (network_out
      (net GND)
    )
  )
)`) as DsnSession

  const places = sessionJson.placement.components[0].places
  expect(places[0].status).toBe("added")
  expect(places[1].status).toBe("substituted")

  const stringified = stringifyDsnSession(sessionJson)
  expect(stringified).toContain("(status added)")
  expect(stringified).toContain("(status substituted)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  const reparsedPlaces = reparsed.placement.components[0].places
  expect(reparsedPlaces[0].status).toBe("added")
  expect(reparsedPlaces[1].status).toBe("substituted")
})
