import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnString,
  convertDsnSessionToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

import circuitJson from "../assets/repro/motor-driver-breakout-circuit.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, DsnSession } from "lib"

// @ts-ignore
import sessionFile from "../assets/repro/motor-driver-breakout-dsn.ses" with {
  type: "text",
}

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

  // image chip
  const chipImage = dsnJson.library.images[0]
  expect(chipImage.name).toBe("simple_chip:7.4322x8.4741_mm")
  expect(chipImage.pins).toHaveLength(24)
  //pin number in the range of 1 to 24
  chipImage.pins.forEach((pin) => {
    expect(pin.pin_number).toBeGreaterThanOrEqual(1)
    expect(pin.pin_number).toBeLessThanOrEqual(24)
  })

  // expect the network to have length 1
  expect(dsnJson.network.nets.length).toBe(16)

  //expect the first net to have length name "GND" and pins length 11
  let foundGndNet = false
  dsnJson.network.nets.forEach((net) => {
    if (net.name === "GND_source_net_1") {
      expect(net.pins.length).toBe(11)
      foundGndNet = true
    }
  })
  expect(foundGndNet).toBe(true)

  //expect the second net to have length name "VCC" and pins length 3
  let foundVccNet = false
  dsnJson.network.nets.forEach((net) => {
    if (net.name === "VCC_source_net_0") {
      expect(net.pins.length).toBe(3)
      foundVccNet = true
    }
  })
  expect(foundVccNet).toBe(true)
})

test("session file (motor driver breakout) -> circuit json", async () => {
  const dsnSession = parseDsnToDsnJson(sessionFile) as DsnSession
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )
  const dsnPcb = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJsonWithOutputTraces = convertDsnSessionToCircuitJson(
    dsnPcb,
    dsnSession,
  )

  //find the circuitJson element type pcb_smtpad
  const pcbSmtpads = circuitJsonWithOutputTraces.filter(
    (element) => element.type === "pcb_smtpad",
  )

  expect(pcbSmtpads).toBeDefined()
  expect(pcbSmtpads?.length).toBe(46)

  //expect the pcbsmtpad to not have x and y values as null
  pcbSmtpads.forEach((pcbSmtpad) => {
    // @ts-ignore - accessing x,y properties that exist on most pad types
    expect(pcbSmtpad.x).not.toBeNull()
    // @ts-ignore - accessing x,y properties that exist on most pad types
    expect(pcbSmtpad.y).not.toBeNull()
  })

  // expect the pcb_trace to not be null
  const pcbTraces = circuitJsonWithOutputTraces.filter(
    (element) => element.type === "pcb_trace",
  )
  expect(pcbTraces).toBeDefined()

  //expect the pcb_via to not be null
  const pcbVias = circuitJsonWithOutputTraces.filter(
    (element) => element.type === "pcb_via",
  )
  expect(pcbVias.length).toBeGreaterThan(0)

  //expect some of the pcb_trace routes to have type 'via'
  const pcbTraceWithVia = pcbTraces.filter((pcbTrace) =>
    pcbTrace.route.some((route) => route.route_type === "via"),
  )
  expect(pcbTraceWithVia.length).toBeGreaterThan(0)
})
