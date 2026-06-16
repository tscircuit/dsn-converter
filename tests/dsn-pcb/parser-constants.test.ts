import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves parser constant descriptors", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb board
  (parser
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
    (constant DEFAULT_WIDTH 100)
    (constant DEFAULT_CLEARANCE 50)
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
  (wiring)
)`) as DsnPcb

  expect(dsnJson.parser.constants).toEqual([
    { name: "DEFAULT_WIDTH", value: "100" },
    { name: "DEFAULT_CLEARANCE", value: "50" },
  ])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(constant DEFAULT_WIDTH 100)")
  expect(stringified).toContain("(constant DEFAULT_CLEARANCE 50)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.parser.constants).toEqual([
    { name: "DEFAULT_WIDTH", value: "100" },
    { name: "DEFAULT_CLEARANCE", value: "50" },
  ])
})
