import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves class circuit priority descriptors", () => {
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
  (network
    (net N1
      (pins U1-1 U2-1)
    )
    (class C1 "" N1
      (circuit
        (use_via Via)
        (priority 42)
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`) as DsnPcb

  expect(dsnJson.network.classes[0].circuit.priority).toBe(42)

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(priority 42)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.network.classes[0].circuit.priority).toBe(42)
})
