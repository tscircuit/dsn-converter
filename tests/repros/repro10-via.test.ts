import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnJson,
  convertDsnSessionToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

import circuitJson from "../assets/repro/WaterCounter.json"
// @ts-ignore
import outputSesFile from "../assets/repro/output_water_counter.ses" with {
  type: "text",
}
import type { AnyCircuitElement } from "circuit-json"
import type { DsnSession } from "lib"

test("Number of vias in the pcb_trace route should match the number of pcb_via elements", async () => {
  const dsnPcb = convertCircuitJsonToDsnJson(circuitJson as AnyCircuitElement[])
  const sessionJson = parseDsnToDsnJson(outputSesFile) as DsnSession

  const circuitJsonFromSession = convertDsnSessionToCircuitJson(
    dsnPcb,
    sessionJson,
    circuitJson as AnyCircuitElement[],
  )

  const outputPcbTraces = circuitJsonFromSession.filter(
    (element) => element.type === "pcb_trace",
  )

  let routeViaPointsCount = 0
  outputPcbTraces.forEach((trace) => {
    trace.route.forEach((point) => {
      if (point.route_type === "via") {
        routeViaPointsCount++
      }
    })
  })

  // Each via point is counted twice (once for each layer)
  routeViaPointsCount /= 2

  const outputPcbVias = circuitJsonFromSession.filter(
    (element) => element.type === "pcb_via",
  )

  expect(routeViaPointsCount).toBe(outputPcbVias.length)
})
