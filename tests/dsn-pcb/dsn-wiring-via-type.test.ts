import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves wiring via type metadata during DSN JSON round trip", () => {
  const dsn = `(pcb board.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0")
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
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins U1-1)
    )
  )
  (wiring
    (via "Via[0-1]_600:300_um" 100 200
      (net "N1")
      (type protect)
    )
  )
)
`

  const parsed = parseDsnToDsnJson(dsn) as DsnPcb
  expect(parsed.wiring.wires[0].type).toBe("via")
  expect(parsed.wiring.wires[0].via_type).toBe("protect")

  const stringified = stringifyDsnJson(parsed)
  expect(stringified).toContain("(type protect)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.wiring.wires[0].type).toBe("via")
  expect(reparsed.wiring.wires[0].via_type).toBe("protect")
})
