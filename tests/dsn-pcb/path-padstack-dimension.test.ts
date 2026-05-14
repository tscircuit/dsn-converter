import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json"

test("imports path padstack dimensions from the stroked path bounds", () => {
  const dsnFile = `(pcb path_padstack_test
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0")
  )
  (resolution um 1)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (path pcb 0 -2000 -2000 2000 -2000 2000 2000 -2000 2000 -2000 -2000)
    )
    (via Via)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement
    (component OvalFootprint
      (place U1 0 0 front 0)
    )
  )
  (library
    (image OvalFootprint
      (pin OvalPad 1 0 0)
    )
    (padstack OvalPad
      (shape (path F.Cu 600 -200 0 200 0))
      (attach off)
    )
  )
  (network
    (net N1
      (pins U1-1)
    )
    (class kicad_default "" N1
      (circuit
        (use_via Via)
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const pad = circuitJson.find((element) => element.type === "pcb_smtpad")

  expect(pad).toMatchObject({
    type: "pcb_smtpad",
    shape: "rect",
    width: 1,
    height: 0.6,
    layer: "top",
  })
})
