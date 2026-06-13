import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves padstack attach use_via descriptors", () => {
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
    (padstack AttachPad
      (shape (circle F.Cu 100))
      (attach on (use_via Via))
    )
  )
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.library.padstacks[0].attach).toBe("on")
  expect(dsnJson.library.padstacks[0].attach_use_via).toBe("Via")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(attach on (use_via Via))")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.library.padstacks[0].attach).toBe("on")
  expect(reparsed.library.padstacks[0].attach_use_via).toBe("Via")
})
