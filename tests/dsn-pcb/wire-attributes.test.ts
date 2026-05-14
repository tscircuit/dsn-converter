import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves wire attr shield and supply metadata", () => {
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
  (network)
  (wiring
    (wire
      (path F.Cu 100 0 0 100 0)
      (net N1)
      (type route)
      (attr fanout)
      (shield GND)
      (supply)
    )
  )
)`) as DsnPcb

  expect(dsnJson.wiring.wires[0].attr).toBe("fanout")
  expect(dsnJson.wiring.wires[0].shield).toBe("GND")
  expect(dsnJson.wiring.wires[0].supply).toBe(true)

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain("(attr fanout)")
  expect(stringified).toContain("(shield GND)")
  expect(stringified).toContain("(supply)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.wiring.wires[0].attr).toBe("fanout")
  expect(reparsed.wiring.wires[0].shield).toBe("GND")
  expect(reparsed.wiring.wires[0].supply).toBe(true)
})
