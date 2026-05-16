import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

import differentSizedPlatedHolesCircuitJson from "../assets/repro/different-sized-plated-holes.json"
import circuitJson from "../assets/repro/plated-hole-resistor-circuit.json"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("circuit json (with plated hole) -> dsn file", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // expect the json placemet to have length 2
  expect(dsnJson.placement.components.length).toBe(2)

  // expect the image to have length 2
  expect(dsnJson.library.images.length).toBe(2)

  // Test plated hole image
  const image = dsnJson.library.images[1]
  expect(image.name).toBe("simple_resistor:3.5400x1.0000_mm")

  // Test padstack for plated hole
  const padstack = dsnJson.library.padstacks.find(
    (p) => p.name === "Round[A]Pad_7000_10000_um",
  )
  expect(padstack).toBeDefined()
  expect(padstack?.shapes).toHaveLength(4) // All 4 copper layers
  expect(padstack?.shapes[0].shapeType).toBe("circle")
  expect(padstack?.shapes[0].layer).toBe("F.Cu")
  expect(padstack?.shapes[1].layer).toBe("In1.Cu")
  expect(padstack?.shapes[2].layer).toBe("In2.Cu")
  expect(padstack?.shapes[3].layer).toBe("B.Cu")
  expect((padstack?.shapes[0] as any).diameter).toBe(10000) // Outer diameter in μm
})

test("different sized plated holes", async () => {
  const dsnFile = convertCircuitJsonToDsnString(
    differentSizedPlatedHolesCircuitJson as AnyCircuitElement[],
  )
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  expect(dsnJson.placement.components.length).toBe(1)

  expect(dsnJson.library.images.length).toBe(1)

  const image = dsnJson.library.images[0]
  expect(image.name).toBe("simple_resistor:4.7000x2.2000_mm")

  expect(image.pins).toHaveLength(2)

  const pin1 = image.pins[0]
  expect(pin1.padstack_name).toBe("Round[A]Pad_10000_12000_um")

  const pin2 = image.pins[1]
  expect(pin2.padstack_name).toBe("Round[A]Pad_20000_22000_um")

  const padstack1 = dsnJson.library.padstacks.find(
    (p) => p.name === "Round[A]Pad_10000_12000_um",
  )
  expect(padstack1).toBeDefined()
  expect(padstack1?.shapes).toHaveLength(4) // All 4 copper layers
  expect((padstack1?.shapes[0] as any).diameter).toBe(12000)

  const padstack2 = dsnJson.library.padstacks.find(
    (p) => p.name === "Round[A]Pad_20000_22000_um",
  )
  expect(padstack2).toBeDefined()
  expect(padstack2?.shapes).toHaveLength(4) // All 4 copper layers
  expect((padstack2?.shapes[0] as any).diameter).toBe(22000)
})
