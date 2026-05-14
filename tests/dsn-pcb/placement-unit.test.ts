import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves placement-level unit descriptors", () => {
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
  (placement
    (unit mil)
    (component R_0603
      (place R1 100 200 front 0)
    )
  )
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.placement.unit).toBe("mil")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(unit mil)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.placement.unit).toBe("mil")
})
