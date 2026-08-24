import { expect, test } from "bun:test"
import { stringifyDsnJson } from "../../lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "../../lib/dsn-pcb/types"

test("preserves numeric parser host version", () => {
  const dsn = `(pcb numeric-host-version
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad")
    (host_version 2024)
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
    (via "Via")
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

  expect(dsnJson.parser.host_version).toBe("2024")

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain('(host_version "2024")')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.parser.host_version).toBe("2024")
})
