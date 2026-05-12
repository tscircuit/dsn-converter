import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
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

test("stringify dsn json preserves padstack hole metadata", () => {
  const dsnJson: DsnPcb = {
    is_dsn_pcb: true,
    filename: "hole-test.dsn",
    parser: {
      string_quote: '"',
      space_in_quoted_tokens: "on",
      host_cad: "test",
      host_version: "test",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [
        { name: "F.Cu", type: "signal", property: { index: 0 } },
        { name: "B.Cu", type: "signal", property: { index: 1 } },
      ],
      boundary: {
        path: { layer: "pcb", width: 0, coordinates: [0, 0, 1000, 0] },
      },
      via: "Via[0-1]_600:300_um",
      rule: { width: 100, clearances: [] },
    },
    placement: { components: [] },
    library: {
      images: [],
      padstacks: [
        {
          name: "Via[0-1]_600:300_um",
          shapes: [
            { shapeType: "circle", layer: "F.Cu", diameter: 600 },
            { shapeType: "circle", layer: "B.Cu", diameter: 600 },
          ],
          hole: { shape: "circle", diameter: 300 },
          attach: "off",
        },
      ],
    },
    network: { nets: [], classes: [] },
    wiring: { wires: [] },
  }

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain("(hole (circle 300))")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.library.padstacks[0].hole).toEqual({
    shape: "circle",
    diameter: 300,
  })
})
