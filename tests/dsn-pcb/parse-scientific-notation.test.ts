import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"

test("parse DSN scientific notation coordinates as numbers", () => {
  const dsn = `(pcb "scientific.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "fixture")
    (host_version "1")
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
      (path pcb 0 1e-3 -2.5E+4 3.25e2 4)
    )
    (via "")
    (rule
      (width 200)
    )
  )
  (placement)
  (library)
  (network)
  (wiring
    (wire
      (path F.Cu 50 1e-3 -2.5E+4 3.25e2 4)
      (net "N1")
      (type route)
    )
  )
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.structure.boundary.path.coordinates).toEqual([
    0.001, -25000, 325, 4,
  ])
  expect(dsnJson.wiring.wires[0].path?.coordinates).toEqual([
    0.001, -25000, 325, 4,
  ])
})
