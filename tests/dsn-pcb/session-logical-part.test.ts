import { expect, test } from "bun:test"
import { stringifyDsnSession } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-session"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnSession } from "lib/dsn-pcb/types"

test("preserves session placement logical_part descriptors", () => {
  const sessionJson = parseDsnToDsnJson(`(session board
  (base_design board)
  (placement
    (resolution um 10)
    (component IC_DIP
      (place U1 100 200 front 0 (logical_part SN54HC688.part))
      (place U2 300 400 back 90 (logical_part SN54HC139.part))
    )
  )
  (routes
    (resolution um 10)
    (parser (host_cad "freerouting") (host_version "1.0"))
    (network_out)
  )
)`) as DsnSession

  const places = sessionJson.placement.components[0].places
  expect(places[0].logical_part).toBe("SN54HC688.part")
  expect(places[1].logical_part).toBe("SN54HC139.part")

  const stringified = stringifyDsnSession(sessionJson)
  expect(stringified).toContain("(logical_part SN54HC688.part)")
  expect(stringified).toContain("(logical_part SN54HC139.part)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  const reparsedPlaces = reparsed.placement.components[0].places
  expect(reparsedPlaces[0].logical_part).toBe("SN54HC688.part")
  expect(reparsedPlaces[1].logical_part).toBe("SN54HC139.part")
})
