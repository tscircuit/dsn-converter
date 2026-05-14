import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves parser case_sensitive and rotate_first flags", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb board
  (parser
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
    (case_sensitive off)
    (rotate_first on)
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

  expect(dsnJson.parser.case_sensitive).toBe("off")
  expect(dsnJson.parser.rotate_first).toBe("on")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(case_sensitive off)")
  expect(stringified).toContain("(rotate_first on)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.parser.case_sensitive).toBe("off")
  expect(reparsed.parser.rotate_first).toBe("on")
})
