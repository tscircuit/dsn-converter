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

test("escapes quoted string values when stringifying dsn json", () => {
  const dsnJson = {
    is_dsn_pcb: true,
    filename: "escaped-values.dsn",
    parser: {
      string_quote: '"',
      space_in_quoted_tokens: "on",
      host_cad: "test",
      host_version: "1",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [
        { name: "F.Cu", type: "signal", property: { index: 0 } },
        { name: "B.Cu", type: "signal", property: { index: 1 } },
      ],
      boundary: {
        path: { layer: "pcb", width: 0, coordinates: [0, 0, 1000, 1000] },
      },
      via: "Via[0-1]_600:300_um",
      rule: { width: 100, clearances: [] },
    },
    placement: {
      components: [
        {
          name: 'Package "A"\\B',
          places: [
            {
              refdes: "U1",
              x: 0,
              y: 0,
              side: "front",
              rotation: 0,
              PN: 'Part "A"\\B',
            },
          ],
        },
      ],
    },
    library: {
      images: [{ name: 'Package "A"\\B', outlines: [], pins: [] }],
      padstacks: [],
    },
    network: {
      nets: [{ name: 'Net "A"\\B', pins: [] }],
      classes: [
        {
          name: 'Class "A"\\B',
          description: 'Description "A"\\B',
          net_names: ['Net "A"\\B'],
          circuit: { use_via: "Via[0-1]_600:300_um" },
          rule: { width: 100, clearances: [] },
        },
      ],
    },
    wiring: { wires: [] },
  } as DsnPcb

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain('"Net \\"A\\"\\\\B"')
  expect(dsnString).toContain('"Part \\"A\\"\\\\B"')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.placement.components[0].name).toBe('Package "A"\\B')
  expect(reparsedJson.placement.components[0].places[0].PN).toBe('Part "A"\\B')
  expect(reparsedJson.network.nets[0].name).toBe('Net "A"\\B')
  expect(reparsedJson.network.classes[0].name).toBe('Class "A"\\B')
  expect(reparsedJson.network.classes[0].description).toBe('Description "A"\\B')
  expect(reparsedJson.network.classes[0].net_names[0]).toBe('Net "A"\\B')
})
