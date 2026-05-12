import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves wire net numbers during DSN JSON round trip", () => {
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
    (wire
      (path F.Cu 200 0 0 1000 0)
      (net "N1" 7)
      (type route)
    )
  )
)
`

  const parsed = parseDsnToDsnJson(dsn) as DsnPcb
  expect(parsed.wiring.wires[0].net).toBe("N1")
  expect(parsed.wiring.wires[0].net_number).toBe(7)

  const stringified = stringifyDsnJson(parsed)
  expect(stringified).toContain('(net "N1" 7)')

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.wiring.wires[0].net).toBe("N1")
  expect(reparsed.wiring.wires[0].net_number).toBe(7)
})
