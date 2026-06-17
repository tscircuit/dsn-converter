import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("padstack circle shape offsets survive DSN JSON stringify round trip", () => {
  const dsnJson: DsnPcb = {
    is_dsn_pcb: true,
    filename: "offset-circle.dsn",
    parser: {
      string_quote: '"',
      host_version: "",
      space_in_quoted_tokens: "on",
      host_cad: "test",
    },
    resolution: {
      unit: "um",
      value: 10,
    },
    unit: "um",
    structure: {
      layers: [
        { name: "F.Cu", type: "signal", property: { index: 0 } },
        { name: "B.Cu", type: "signal", property: { index: 1 } },
      ],
      boundary: {
        path: {
          layer: "pcb",
          width: 0,
          coordinates: [0, 0, 1000, 0, 1000, 1000, 0, 1000, 0, 0],
        },
      },
      via: "Via[0-1]_600:300_um",
      rule: {
        clearances: [{ value: 150 }],
        width: 150,
      },
    },
    placement: {
      components: [],
    },
    library: {
      images: [],
      padstacks: [
        {
          name: "OffsetCircle",
          shapes: [
            {
              shapeType: "circle",
              layer: "F.Cu",
              diameter: 600,
              x: 25,
              y: -50,
            },
          ],
          attach: "off",
        },
      ],
    },
    network: {
      nets: [],
      classes: [],
    },
    wiring: {
      wires: [],
    },
  }

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain("(shape (circle F.Cu 600 25 -50))")
  expect(reparsedJson.library.padstacks[0].shapes[0]).toMatchObject({
    shapeType: "circle",
    layer: "F.Cu",
    diameter: 600,
    x: 25,
    y: -50,
  })
})
