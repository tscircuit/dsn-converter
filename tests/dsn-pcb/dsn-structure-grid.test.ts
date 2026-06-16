import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves structure grid descriptors", () => {
  const dsn = `(pcb grid-test
  (parser
    (string_quote quote)
    (space_in_quoted_tokens on)
    (host_cad "test")
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
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via Via[0-1])
    (grid via 1)
    (grid wire 5)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.structure.grids).toEqual([
    { kind: "via", value: 1 },
    { kind: "wire", value: 5 },
  ])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(grid via 1)")
  expect(stringified).toContain("(grid wire 5)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.structure.grids).toEqual(dsnJson.structure.grids)
})
