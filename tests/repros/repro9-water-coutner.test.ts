import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib"

import circuitJson from "../assets/repro/WaterCounter.json"
import type { AnyCircuitElement } from "circuit-json"

test("RoundRect padstack for chip with pad shape circle", async () => {
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson as AnyCircuitElement[])

  expect(dsnJson).toBeDefined()
  expect(dsnJson.library.padstacks.length).toBe(7)
  expect(dsnJson.library.padstacks[5].name).toBe("RoundRect[T]Pad_3000x3000_um")
  expect(dsnJson.library.images.length).toBe(4)
  expect(dsnJson.library.images[1].pins.length).toBe(25)
})
