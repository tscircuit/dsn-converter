import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json"

const dsnWithWiringVia = `
(pcb wiring-via-padstack-dimensions
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
    (boundary (path pcb 0 0 0 20000 0 20000 20000 0 20000 0 0))
    (via "Via[0-1]_800:400_um")
    (rule
      (width 200)
      (clearance 200)
    )
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
    (net AGND)
  )
  (wiring
    (via "Via[0-1]_800:400_um" 10000 5000 (net AGND))
  )
)
`

test("parses wiring via padstack names", () => {
  const dsnPcb = parseDsnToDsnJson(dsnWithWiringVia) as DsnPcb

  expect(dsnPcb.wiring.wires[0].padstack_name).toBe("Via[0-1]_800:400_um")
})

test("uses wiring via padstack dimensions when converting to circuit json", () => {
  const dsnPcb = parseDsnToDsnJson(dsnWithWiringVia) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnPcb)
  const vias = su(circuitJson).pcb_via.list()

  expect(vias).toHaveLength(1)
  expect(vias[0].outer_diameter).toBe(0.8)
  expect(vias[0].hole_diameter).toBe(0.4)
})
