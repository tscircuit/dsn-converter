import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"
import circuitJson from "../assets/repro/plated-hole-resistor-circuit.json"

test("dsn round-trip: circular through-hole pads become pcb_plated_hole", async () => {
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  const platedHoles = circuitJson2.filter(
    (e) => e.type === "pcb_plated_hole",
  ) as any[]

  // Two pins on the resistor, both through-hole
  expect(platedHoles.length).toBe(2)

  for (const hole of platedHoles) {
    expect(hole.shape).toBe("circle")
    // outer_diameter = 1.0 mm, hole_diameter = 0.7 mm (from Round[A]Pad_700_1000_um)
    expect(hole.outer_diameter).toBeCloseTo(1.0, 3)
    expect(hole.hole_diameter).toBeCloseTo(0.7, 3)
    expect(hole.layers).toEqual(["top", "bottom"])
  }
})

test("dsn import: padstacks with shapes on both F.Cu and B.Cu are through-hole", async () => {
  // Minimal DSN with a single through-hole component
  const dsnText = `(pcb test.dsn
  (parser
    (string_quote ")
    (host_version "0.0.1")
    (space_in_quoted_tokens on)
    (host_cad "test")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary (rect pcb -50000 -50000 50000 50000))
    (via "Via[0-1]_600:300_um")
    (rule (width 200) (clearance 200))
  )
  (placement
    (component "DIP_IC"
      (place U1 0 0 front 0)
    )
  )
  (library
    (image "DIP_IC"
      (pin "Round[A]Pad_800_1600_um" 1 -2540 0)
      (pin "Round[A]Pad_800_1600_um" 2 2540 0)
    )
    (padstack "Round[A]Pad_800_1600_um"
      (shape (circle F.Cu 1600))
      (shape (circle B.Cu 1600))
      (attach off)
    )
  )
  (network
    (net "VCC" (pins U1-1))
    (net "GND" (pins U1-2))
    (class kicad_default "" "VCC" "GND"
      (circuit (use_via "Via[0-1]_600:300_um"))
      (rule (width 200) (clearance 200))
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnText) as DsnPcb
  const elements = convertDsnJsonToCircuitJson(dsnJson)

  const platedHoles = elements.filter(
    (e) => e.type === "pcb_plated_hole",
  ) as any[]

  expect(platedHoles.length).toBe(2)

  const hole = platedHoles[0]
  expect(hole.shape).toBe("circle")
  expect(hole.outer_diameter).toBeCloseTo(1.6, 3)
  expect(hole.hole_diameter).toBeCloseTo(0.8, 3)
  expect(hole.layers).toEqual(["top", "bottom"])

  // No SMT pads should be generated for through-hole component
  const smtPads = elements.filter((e) => e.type === "pcb_smtpad")
  expect(smtPads.length).toBe(0)
})
