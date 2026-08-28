import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
// @ts-ignore
import freeroutingTraceAddedDsnFile from "../assets/testkicadproject/freeroutingTraceAdded.dsn" with {
  type: "text",
}
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

test("stringify dsn json", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  for (const key of Object.keys(reparsedJson) as Array<keyof DsnPcb>) {
    expect(reparsedJson[key]).toEqual(dsnJson[key] as any)
  }

  // Test that we can parse the generated string back to the same structure
  // expect(reparsedJson).toEqual(dsnJson)
})

test("preserves placement pin clearance classes", () => {
  const dsnJson = parseDsnToDsnJson(freeroutingTraceAddedDsnFile) as DsnPcb
  const resistor = dsnJson.placement.components.find(
    (component) => component.name === "Resistor_SMD:R_0402_1005Metric",
  )
  const r1 = resistor?.places.find((place) => place.refdes === "R1")

  expect(r1?.pins).toEqual([
    { pin_number: 1, clearance_class: "kicad_default" },
    { pin_number: 2, clearance_class: "kicad_default" },
  ])

  const stringifierSafeDsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const placeToRoundTrip =
    stringifierSafeDsnJson.placement.components[0].places[0]
  placeToRoundTrip.pins = r1?.pins

  const reparsedJson = parseDsnToDsnJson(
    stringifyDsnJson(stringifierSafeDsnJson),
  ) as DsnPcb
  const reparsedResistor = reparsedJson.placement.components.find(
    (component) =>
      component.name === stringifierSafeDsnJson.placement.components[0].name,
  )
  const reparsedR1 = reparsedResistor?.places.find(
    (place) => place.refdes === placeToRoundTrip.refdes,
  )

  expect(reparsedR1?.pins).toEqual(r1?.pins)
})
