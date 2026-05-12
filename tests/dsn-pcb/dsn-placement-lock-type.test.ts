import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves placement lock_type metadata during DSN JSON round trip", () => {
  const dsn = `(pcb lock_type_fixture.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "fixture")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000)
    )
    (via "")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement
    (component RES_0603
      (place R1 100 200 front 90 (lock_type position) (PN "10k"))
    )
  )
  (library
    (image RES_0603)
  )
  (network)
  (wiring)
)`

  const parsed = parseDsnToDsnJson(dsn) as DsnPcb
  const place = parsed.placement.components[0].places[0]

  expect(place.lock_type).toBe("position")
  expect(place.PN).toBe("10k")

  const stringified = stringifyDsnJson(parsed)

  expect(stringified).toContain("(lock_type position)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  const reparsedPlace = reparsed.placement.components[0].places[0]

  expect(reparsedPlace.lock_type).toBe("position")
  expect(reparsedPlace.PN).toBe("10k")
})
