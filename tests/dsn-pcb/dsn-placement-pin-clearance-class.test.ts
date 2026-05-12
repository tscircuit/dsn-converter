import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithPlacementPinClearance = `(pcb "pin-clearance.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "fixture")
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
      (clearance 100)
    )
  )
  (placement
    (component "Resistor_SMD:R_0402_1005Metric"
      (place
        R1 100 200 front 90
        (pin 1 (clearance_class "fine_pitch"))
        (pin A (clearance_class default))
      )
    )
  )
  (library
    (image "Resistor_SMD:R_0402_1005Metric")
    (padstack "Via[0-1]_600:300_um"
      (shape (circle F.Cu 600))
      (attach off)
    )
  )
  (network
    (net "Net-(R1-Pad1)"
      (pins R1-1)
    )
  )
  (wiring)
)`

test("preserves placement pin clearance classes", () => {
  const parsed = parseDsnToDsnJson(dsnWithPlacementPinClearance) as DsnPcb

  const place = parsed.placement.components[0].places[0]
  expect(place.pins).toEqual([
    { pin_number: 1, clearance_class: "fine_pitch" },
    { pin_number: "A", clearance_class: "default" },
  ])

  const stringified = stringifyDsnJson(parsed)
  expect(stringified).toContain('(pin 1 (clearance_class "fine_pitch"))')
  expect(stringified).toContain('(pin "A" (clearance_class "default"))')

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.placement.components[0].places[0].pins).toEqual(place.pins)
})
