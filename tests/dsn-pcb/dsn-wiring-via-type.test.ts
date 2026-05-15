import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves wiring via type metadata", () => {
  const dsn = `(pcb "via-type.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0))
    (via "Via[0-1]_800:400_um")
    (rule (width 200) (clearance 200))
  )
  (placement)
  (library
    (padstack "Via[0-1]_800:400_um"
      (shape (circle F.Cu 800))
      (shape (circle B.Cu 800))
      (attach off)
    )
  )
  (network
    (net AGND
      (pins U1-1)
    )
    (class kicad_default "" AGND
      (circuit (use_via "Via[0-1]_800:400_um"))
      (rule (width 200) (clearance 200))
    )
  )
  (wiring
    (via "Via[0-1]_800:400_um" 198628 -77470 (net AGND)(type protect))
  )
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.wiring.wires[0]).toMatchObject({
    type: "via",
    via_type: "protect",
  })

  const reparsed = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb
  expect(reparsed.wiring.wires[0]).toMatchObject({
    type: "via",
    via_type: "protect",
  })
})
