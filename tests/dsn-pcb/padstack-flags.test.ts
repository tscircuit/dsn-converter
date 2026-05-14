import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves padstack rotate and absolute flags", () => {
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
    (padstack FlagPad
      (shape (circle F.Cu 100))
      (attach off)
      (rotate on)
      (absolute on)
    )
  )
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.library.padstacks[0].rotate).toBe("on")
  expect(dsnJson.library.padstacks[0].absolute).toBe("on")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(rotate on)")
  expect(stringified).toContain("(absolute on)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.library.padstacks[0].rotate).toBe("on")
  expect(reparsed.library.padstacks[0].absolute).toBe("on")
})
