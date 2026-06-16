import { expect, test } from "bun:test"
import { stringifyDsnSession } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-session"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnSession } from "lib/dsn-pcb/types"

test("preserves placement place_control flip_style descriptors", () => {
  const sessionJson = parseDsnToDsnJson(`(session board
  (base_design board)
  (placement
    (resolution um 10)
    (place_control (flip_style rotate_first))
    (component R_0603
      (place R1 100 200 front 0)
    )
  )
  (routes
    (resolution um 10)
    (parser (host_cad "freerouting") (host_version "1.0"))
    (network_out)
  )
)`) as DsnSession

  expect(sessionJson.placement.place_control?.flip_style).toBe("rotate_first")

  const stringified = stringifyDsnSession(sessionJson)
  expect(stringified).toContain("(place_control (flip_style rotate_first))")

  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  expect(reparsed.placement.place_control?.flip_style).toBe("rotate_first")
})
