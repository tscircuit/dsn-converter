import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves wire polyline_path and clearance_class metadata", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb board
  (parser
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property (index 0))
    )
    (boundary
      (path pcb 0 0 0 100 0 100 100 0 100 0 0)
    )
    (via Via)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring
    (wire
      (polyline_path F.Cu 100 0 0 50 50 100 0)
      (net N1)
      (clearance_class DEFAULT)
      (type route)
    )
  )
)`) as DsnPcb

  expect(dsnJson.wiring.wires[0].polyline_path).toEqual({
    layer: "F.Cu",
    width: 100,
    coordinates: [0, 0, 50, 50, 100, 0],
  })
  expect(dsnJson.wiring.wires[0].clearance_class).toBe("DEFAULT")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(polyline_path F.Cu 100 0 0 50 50 100 0)")
  expect(stringified).toContain("(clearance_class DEFAULT)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.wiring.wires[0].polyline_path).toEqual({
    layer: "F.Cu",
    width: 100,
    coordinates: [0, 0, 50, 50, 100, 0],
  })
  expect(reparsed.wiring.wires[0].clearance_class).toBe("DEFAULT")
})
