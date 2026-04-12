import { expect, test } from "bun:test"
import { parseDsnToDsnJson } from "lib"
import type { DsnPcb } from "lib"
import { convertDsnPcbToCircuitJson } from "lib"
import type { SourcePort } from "circuit-json"

// Minimal DSN with a pin that has a rotation specifier:
//   (pin padstack (rotate angle) pin_number x y)
// The parser must read the actual pin number from after the rotation list,
// not the word "rotate" itself.
const MINIMAL_DSN_WITH_ROTATION = `
(pcb test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "5.0.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
    )
    (boundary
      (rect pcb 0 0 100000 100000)
    )
    (via "Via[0-1]_800:400_um" "Via[0-1]_800:400_um")
    (rule
      (width 250)
      (clearance 200)
    )
  )
  (placement
    (component "lib:CONN_2PIN"
      (place J1 50000 50000 front 0 (PN "Connector"))
    )
    (component "lib:LED"
      (place D1 70000 50000 front 0 (PN "LED"))
    )
  )
  (library
    (image "lib:CONN_2PIN"
      (pin Round[A]Pad_1600_um (rotate 90) 2 2540 0)
      (pin Rect[A]Pad_1600x1600_um (rotate 90) 1 0 0)
    )
    (image "lib:LED"
      (pin Rect[T]Pad_1200x1200_um (rotate 0) A 0 -1050)
      (pin Rect[T]Pad_1200x1200_um (rotate 0) C 0 1050)
    )
    (padstack "Round[A]Pad_1600_um"
      (shape (circle F.Cu 1600))
      (attach off)
    )
    (padstack "Rect[A]Pad_1600x1600_um"
      (shape (rect F.Cu -800 -800 800 800))
      (attach off)
    )
    (padstack "Rect[T]Pad_1200x1200_um"
      (shape (rect F.Cu -600 -600 600 600))
      (attach off)
    )
  )
  (network
    (net GND
      (pins J1-1 D1-C)
    )
    (net VCC
      (pins J1-2 D1-A)
    )
    (class default
      (circuit (use_via "Via[0-1]_800:400_um"))
      (rule (width 250) (clearance 200))
    )
  )
  (wiring)
)
`

test("pins with rotation spec get correct pin_number and coordinates", () => {
  const dsnJson = parseDsnToDsnJson(MINIMAL_DSN_WITH_ROTATION) as DsnPcb

  // Verify parser read pin numbers correctly from after the rotation spec
  const connImage = dsnJson.library.images.find(
    (img) => img.name === "lib:CONN_2PIN",
  )
  expect(connImage).toBeDefined()
  expect(connImage!.pins).toHaveLength(2)
  // Pin 2: (rotate 90) 2 2540 0
  expect(connImage!.pins![0].pin_number).toBe(2)
  expect(connImage!.pins![0].x).toBe(2540)
  expect(connImage!.pins![0].y).toBe(0)
  // Pin 1: (rotate 90) 1 0 0
  expect(connImage!.pins![1].pin_number).toBe(1)
  expect(connImage!.pins![1].x).toBe(0)
  expect(connImage!.pins![1].y).toBe(0)

  const ledImage = dsnJson.library.images.find((img) => img.name === "lib:LED")
  expect(ledImage).toBeDefined()
  // Pin A (non-numeric): (rotate 0) A 0 -1050
  expect(ledImage!.pins![0].pin_number).toBe("A")
  expect(ledImage!.pins![0].x).toBe(0)
  expect(ledImage!.pins![0].y).toBe(-1050)
  // Pin C (non-numeric): (rotate 0) C 0 1050
  expect(ledImage!.pins![1].pin_number).toBe("C")
  expect(ledImage!.pins![1].x).toBe(0)
  expect(ledImage!.pins![1].y).toBe(1050)
})

test("non-numeric pin names get sequential pin_number with original name preserved in port_hints", () => {
  const dsnJson = parseDsnToDsnJson(MINIMAL_DSN_WITH_ROTATION) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (e): e is SourcePort => e.type === "source_port",
  )

  // All source_ports must have a valid (non-NaN, non-null) pin_number
  const badPorts = sourcePorts.filter(
    (p) =>
      p.pin_number === null ||
      p.pin_number === undefined ||
      Number.isNaN(p.pin_number),
  )
  expect(badPorts).toHaveLength(0)

  // Numeric pins (J1-1 and J1-2) should have their original numbers
  const j1Ports = sourcePorts.filter((p) => p.name?.startsWith("J1-"))
  expect(j1Ports.find((p) => p.pin_number === 1)).toBeDefined()
  expect(j1Ports.find((p) => p.pin_number === 2)).toBeDefined()

  // Non-numeric LED pins should have sequential pin_number and preserve the
  // original name in port_hints
  const d1Ports = sourcePorts.filter((p) => p.name?.startsWith("D1-"))
  expect(d1Ports).toHaveLength(2)
  for (const p of d1Ports) {
    expect(typeof p.pin_number).toBe("number")
    expect(Number.isNaN(p.pin_number)).toBe(false)
    expect(p.port_hints!.length).toBeGreaterThan(0)
    expect(["A", "C"]).toContain(p.port_hints![0])
  }
})
