import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves structure keepout descriptors", () => {
  const dsn = `(pcb keepout-test
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
    (keepout (rect signal 10 20 30 40))
    (via_keepout (rect signal 50 60 70 80))
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
  expect(dsnJson.structure.keepouts).toEqual([
    {
      kind: "keepout",
      shape: {
        shapeType: "rect",
        layer: "signal",
        coordinates: [10, 20, 30, 40],
      },
    },
    {
      kind: "via_keepout",
      shape: {
        shapeType: "rect",
        layer: "signal",
        coordinates: [50, 60, 70, 80],
      },
    },
  ])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(keepout (rect signal 10 20 30 40))")
  expect(stringified).toContain("(via_keepout (rect signal 50 60 70 80))")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.structure.keepouts).toEqual(dsnJson.structure.keepouts)
})
