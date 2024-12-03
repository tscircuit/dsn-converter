import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

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
  expect(image.name).toBe("MountingHole:MountingHole_700um_1000um_Pad")

  // Test padstack for plated hole
  const padstack = dsnJson.library.padstacks.find(
    (p) => p.name === "Round[A]Pad_700_1000_um",
  )
  expect(padstack).toBeDefined()
  expect(padstack?.shapes).toHaveLength(2) // Top and bottom copper
  expect(padstack?.shapes[0].shapeType).toBe("circle")
  expect(padstack?.shapes[0].layer).toBe("F.Cu")
  expect((padstack?.shapes[0] as any).diameter).toBe(1000) // Outer diameter in μm
})
