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

  // expect the network to have length 1
  expect(dsnJson.network.nets.length).toBe(16)

  //expect the first net to have length name "GND" and pins length 11
  expect(dsnJson.network.nets[0].name).toBe("GND")
  expect(dsnJson.network.nets[0].pins.length).toBe(11)

  //expect the second net to have length name "VCC" and pins length 3
  expect(dsnJson.network.nets[1].name).toBe("VCC")
  expect(dsnJson.network.nets[1].pins.length).toBe(3)
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
    expect(pcbSmtpad.x).not.toBeNull()
    expect(pcbSmtpad.y).not.toBeNull()
  })

  // expect the pcb_trace to not be null
  const pcbTraces = circuitJsonWithOutputTraces.filter(
    (element) => element.type === "pcb_trace",
  )
  expect(pcbTraces).toBeDefined()

  Bun.write(
    "circuit-json-with-output-traces.json",
    JSON.stringify(circuitJsonWithOutputTraces, null, 2),
  )

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
