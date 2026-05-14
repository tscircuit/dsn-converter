import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves net expose and noexpose descriptors", () => {
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
      (pins U1-1 U2-1 U3-1)
      (expose U1-1 U2-1)
      (noexpose U3-1)
    )
  )
  (wiring)
)`) as DsnPcb

  expect(dsnJson.network.nets[0].expose).toEqual(["U1-1", "U2-1"])
  expect(dsnJson.network.nets[0].noexpose).toEqual(["U3-1"])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(expose U1-1 U2-1)")
  expect(stringified).toContain("(noexpose U3-1)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.network.nets[0].expose).toEqual(["U1-1", "U2-1"])
  expect(reparsed.network.nets[0].noexpose).toEqual(["U3-1"])
})
