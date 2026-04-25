import { expect, test } from "bun:test"
import { parseDsnToDsnJson, convertDsnJsonToCircuitJson } from "lib"
import type { DsnPcb } from "lib"
import type { PcbPlatedHole } from "circuit-json"

const DSN_WITH_PLATED_HOLES = `(pcb ./test_plated_holes.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "")
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
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0  -10000 -10000 10000 -10000 10000 10000 -10000 10000 -10000 -10000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 200)
    )
  )
  (placement
    (component "DIP_Package"
      (place IC1 0 0 front 0 (PN "DIP-8"))
    )
  )
  (library
    (image "DIP_Package"
      (pin "Round[A]Pad_700_1000_um" 1 -2500 0)
      (pin "Round[A]Pad_700_1000_um" 2 2500 0)
    )
    (padstack "Via[0-1]_600:300_um"
      (shape (circle F.Cu 600))
      (shape (circle B.Cu 600))
      (attach off)
    )
    (padstack "Round[A]Pad_700_1000_um"
      (shape (circle F.Cu 1000))
      (shape (circle B.Cu 1000))
      (hole circle 700)
      (attach off)
    )
  )
  (network
    (net "VCC"
      (pins IC1-1)
    )
    (net "GND"
      (pins IC1-2)
    )
    (class "kicad_default" "" "VCC" "GND"
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 200)
        (clearance 200)
      )
    )
  )
  (wiring
  )
)
`

test("DSN padstacks with hole definition are converted to pcb_plated_hole", () => {
  const dsnJson = parseDsnToDsnJson(DSN_WITH_PLATED_HOLES) as DsnPcb

  // Verify the padstack has been parsed with hole info
  const platedPadstack = dsnJson.library.padstacks.find(
    (p) => p.name === "Round[A]Pad_700_1000_um",
  )
  expect(platedPadstack).toBeDefined()
  expect(platedPadstack!.hole).toBeDefined()
  expect(platedPadstack!.hole!.shape).toBe("circle")
  expect(platedPadstack!.hole!.diameter).toBe(700)

  // Convert to circuit JSON and check for pcb_plated_hole elements
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const platedHoles = circuitJson.filter(
    (el): el is PcbPlatedHole => el.type === "pcb_plated_hole",
  )

  // IC1 has 2 pins, both should be pcb_plated_hole
  expect(platedHoles.length).toBe(2)

  const hole1 = platedHoles[0]
  expect(hole1.shape).toBe("circle")
  expect(hole1.hole_diameter).toBeCloseTo(0.7, 4) // 700um -> 0.7mm
  expect(hole1.outer_diameter).toBeCloseTo(1.0, 4) // 1000um -> 1.0mm
  expect(hole1.layers).toContain("top")
  expect(hole1.layers).toContain("bottom")

  // Should NOT have pcb_smtpad for these pins
  const smtPads = circuitJson.filter(
    (el) => el.type === "pcb_smtpad",
  )
  expect(smtPads.length).toBe(0)
})
