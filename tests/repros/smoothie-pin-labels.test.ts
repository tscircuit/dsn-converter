import { expect, test } from "bun:test"
import {
  type DsnPcb,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
import type { SourcePort } from "circuit-json"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

// A minimal DSN with:
// 1. A pin with a non-numeric label (A, C, +, -)
// 2. A pin with (rotate 90) modifier
// 3. Standard numeric pins
const TEST_DSN = `(pcb "test"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1.0")
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
      (path pcb 0  0 0  100000 0  100000 100000  0 100000  0 0)
    )
    (via "Via[0-1]_800:400_um")
  )
  (placement
    (component "TEST_COMP"
      (place U1 50000 50000 front 0 (PN TEST_COMP))
    )
  )
  (library
    (image "TEST_COMP"
      (outline (path signal 120  -5000 -5000  -5000 5000))
      (outline (path signal 120  -5000 5000  5000 5000))
      (outline (path signal 120  5000 5000  5000 -5000))
      (outline (path signal 120  5000 -5000  -5000 -5000))
      (pin "Round[A]_800_um" 1 -2000 0)
      (pin "Round[A]_800_um" 2 0 0)
      (pin "Round[A]_800_um" (rotate 90) A 2000 0)
      (pin "Round[A]_800_um" C 4000 0)
    )
    (padstack "Round[A]_800_um"
      (shape (circle F.Cu 800 0 0))
      (shape (circle B.Cu 800 0 0))
      (attach off)
      (hole 400)
    )
  )
  (network
    (net "GND"
      (pins "U1-1" "U1-2")
    )
    (net "SIG_A"
      (pins "U1-A")
    )
    (net "SIG_C"
      (pins "U1-C")
    )
  )
  (wiring
  )
)`

test("non-numeric pin labels don't produce NaN pin_number", () => {
  const dsnJson = parseDsnToDsnJson(TEST_DSN) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (el) => el.type === "source_port",
  ) as SourcePort[]

  // No port should have NaN pin_number
  for (const port of sourcePorts) {
    expect(Number.isNaN(port.pin_number)).toBe(false)
  }

  // Numeric pins should have numeric pin_number
  const port1 = sourcePorts.find((p) => p.name === "U1-1")
  expect(port1).toBeDefined()
  expect(port1!.pin_number).toBe(1)

  const port2 = sourcePorts.find((p) => p.name === "U1-2")
  expect(port2).toBeDefined()
  expect(port2!.pin_number).toBe(2)

  // Non-numeric pin labels should have undefined pin_number
  const portA = sourcePorts.find((p) => p.name === "U1-A")
  expect(portA).toBeDefined()
  expect(portA!.pin_number).toBeUndefined()

  const portC = sourcePorts.find((p) => p.name === "U1-C")
  expect(portC).toBeDefined()
  expect(portC!.pin_number).toBeUndefined()
})

test("(rotate 90) pin modifier is parsed correctly", () => {
  const dsnJson = parseDsnToDsnJson(TEST_DSN) as DsnPcb

  // The image should have 4 pins
  const image = dsnJson.library.images.find((img) => img.name === "TEST_COMP")
  expect(image).toBeDefined()
  expect(image!.pins).toHaveLength(4)

  // Pin with (rotate 90) should have pin_number "A" and correct coordinates
  const pinA = image!.pins!.find((p) => p.pin_number === "A")
  expect(pinA).toBeDefined()
  expect(pinA!.x).toBe(2000)
  expect(pinA!.y).toBe(0)

  // Pin 1 should have correct coordinates
  const pin1 = image!.pins!.find((p) => p.pin_number === 1)
  expect(pin1).toBeDefined()
  expect(pin1!.x).toBe(-2000)
  expect(pin1!.y).toBe(0)
})

test("smoothieboard repro has no NaN pin numbers", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (el) => el.type === "source_port",
  ) as SourcePort[]

  const nanCount = sourcePorts.filter(
    (p) => p.pin_number !== undefined && Number.isNaN(p.pin_number),
  ).length

  expect(nanCount).toBe(0)
})
