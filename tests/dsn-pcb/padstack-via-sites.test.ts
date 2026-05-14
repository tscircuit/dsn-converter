import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves padstack via_site descriptors", () => {
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
  (library
    (padstack ViaSitePad
      (shape (circle F.Cu 100))
      (attach off)
      (via_site 10 20)
      (via_site off)
    )
  )
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.library.padstacks[0].via_sites).toEqual([
    { x: 10, y: 20 },
    "off",
  ])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(via_site 10 20)")
  expect(stringified).toContain("(via_site off)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.library.padstacks[0].via_sites).toEqual([
    { x: 10, y: 20 },
    "off",
  ])
})
