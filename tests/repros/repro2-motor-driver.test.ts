import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/motor-driver-breakout-circuit.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("circuit json (motor driver breakout) -> dsn file", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // expect the json placemet to have length 3
  expect(dsnJson.placement.components.length).toBe(3)

  // expect the image to have length 3
  expect(dsnJson.library.images.length).toBe(3)

  // expect the network to have length 1
  expect(dsnJson.network.nets.length).toBe(16)

  //expect the first net to have length name "GND" and pins length 11
  expect(dsnJson.network.nets[0].name).toBe("GND")
  expect(dsnJson.network.nets[0].pins.length).toBe(11)

  //expect the second net to have length name "VCC" and pins length 3
  expect(dsnJson.network.nets[1].name).toBe("VCC")
  expect(dsnJson.network.nets[1].pins.length).toBe(3)
})
