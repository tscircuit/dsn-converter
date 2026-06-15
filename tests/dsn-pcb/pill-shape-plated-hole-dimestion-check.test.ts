import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"
import circuitJson from "../assets/repro/pill-shaped-plated-hole.json"

test("check pill shape plated hole dimension", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  const pcbSmtpads = circuitJson2.filter((e) => e.type === "pcb_smtpad")
  expect(pcbSmtpads.length).toBe(0)

  const pcbPlatedHoles = circuitJson2.filter(
    (e) => e.type === "pcb_plated_hole",
  )
  expect(pcbPlatedHoles.length).toBe(1)

  const platedHole = pcbPlatedHoles[0]
  expect(platedHole).toMatchObject({
    type: "pcb_plated_hole",
    shape: "pill",
    layers: ["top", "bottom"],
  })
  if (platedHole.shape !== "pill") {
    throw new Error(`Expected pill plated hole, got ${platedHole.shape}`)
  }
  expect(platedHole.outer_width).toBeCloseTo(1.2)
  expect(platedHole.outer_height).toBeCloseTo(1.8)
  expect(platedHole.hole_width).toBeCloseTo(0.8)
  expect(platedHole.hole_height).toBeCloseTo(1.4)
})
