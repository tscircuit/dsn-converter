import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"
import circuitJson from "../assets/testkicadproject/circuitJson.json"

test("circuit json to dsn file", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // expect the images pin to be in increasing order of position
  expect(dsnJson.library.images[0].pins[0].x).toBe(-500)
  expect(dsnJson.library.images[0].pins[0].y).toBe(0)

  expect(dsnJson.library.images[0].pins[1].x).toBe(500)
  expect(dsnJson.library.images[0].pins[1].y).toBe(0)

  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson2)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test("uses passive display values for placement PN metadata", () => {
  const circuitElements = JSON.parse(
    JSON.stringify(circuitJson),
  ) as AnyCircuitElement[]

  const resistor = circuitElements.find(
    (element) =>
      element.type === "source_component" &&
      element.source_component_id === "source_component_0",
  ) as any
  resistor.display_resistance = "10kΩ"

  const capacitor = circuitElements.find(
    (element) =>
      element.type === "source_component" &&
      element.source_component_id === "source_component_1",
  ) as any
  capacitor.display_capacitance = "10nF"

  const dsnFile = convertCircuitJsonToDsnString(circuitElements)
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const places = dsnJson.placement.components.flatMap(
    (component) => component.places,
  )

  expect(places.find((place) => place.refdes.startsWith("R1_"))?.PN).toBe(
    "10kΩ",
  )
  expect(places.find((place) => place.refdes.startsWith("C1_"))?.PN).toBe(
    "10nF",
  )
})
