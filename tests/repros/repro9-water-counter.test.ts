import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib"

import type { AnyCircuitElement } from "circuit-json"
import circuitJson from "../assets/repro/WaterCounter.json"

test("RoundRect padstack for chip with pad shape circle", async () => {
  const dsnJson = convertCircuitJsonToDsnJson(
    circuitJson as AnyCircuitElement[],
  )

  expect(dsnJson).toBeDefined()
  // 7 original padstacks + 1 NPTH padstack for the pcb_hole
  expect(dsnJson.library.padstacks.length).toBe(8)
  expect(dsnJson.library.padstacks[5].name).toBe("RoundRect[T]Pad_3000x3000_um")
  // 4 component images + 1 NPTH image for the pcb_hole
  expect(dsnJson.library.images.length).toBe(5)
  expect(dsnJson.library.images[1].pins.length).toBe(25)
})
