import { expect, test } from "bun:test"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json"
import { parseDsnToDsnJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "../../lib/dsn-pcb/types"

test("imports a single-layer path padstack as a pill", () => {
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
      (pin DiagonalOvalPad 2 1000 0)
    )
    (padstack OvalPad
      (shape (path F.Cu 600 -200 0 200 0))
      (attach off)
    )
    (padstack DiagonalOvalPad
      (shape (path F.Cu 200 0 0 300 400))
      (attach off)
    )
  )
  (network
    (net N1
      (pins U1-1 U1-2)
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
  const pads = circuitJson.filter((element) => element.type === "pcb_smtpad")
  const horizontalPad = pads.find((pad) => pad.port_hints?.includes("1"))
  const diagonalPad = pads.find((pad) => pad.port_hints?.includes("2"))

  expect(horizontalPad).toMatchObject({
    type: "pcb_smtpad",
    shape: "pill",
    width: 1,
    height: 0.6,
    radius: 0.3,
    layer: "top",
  })
  expect(diagonalPad).toMatchObject({
    type: "pcb_smtpad",
    shape: "rotated_pill",
    width: 0.7,
    height: 0.2,
    radius: 0.1,
    x: 1.15,
    y: 0.2,
    layer: "top",
  })
  expect(
    diagonalPad && "ccw_rotation" in diagonalPad
      ? diagonalPad.ccw_rotation
      : undefined,
  ).toBeCloseTo(53.13010235415595, 10)
})
