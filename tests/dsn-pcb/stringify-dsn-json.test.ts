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

test("quotes clearance type names when stringifying", () => {
  const dsnJson: DsnPcb = {
    is_dsn_pcb: true,
    filename: "clearance-types.dsn",
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
        {
          name: "F.Cu",
          type: "signal",
          property: {
            index: 0,
          },
        },
      ],
      boundary: {
        path: {
          layer: "pcb",
          width: 0,
          coordinates: [0, 0, 1000, 0, 1000, 1000, 0, 1000, 0, 0],
        },
      },
      via: "Via[0-0]_600:300_um",
      rule: {
        width: 200,
        clearances: [
          {
            value: 200,
            type: "kicad default",
          },
        ],
      },
    },
    placement: {
      components: [],
    },
    library: {
      images: [],
      padstacks: [],
    },
    network: {
      nets: [],
      classes: [
        {
          name: "default",
          description: "",
          net_names: [],
          circuit: {
            use_via: "Via[0-0]_600:300_um",
          },
          rule: {
            width: 100,
            clearances: [
              {
                value: 50,
                type: "class gap",
              },
            ],
          },
        },
      ],
    },
    wiring: {
      wires: [],
    },
  }

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain('(clearance 200 (type "kicad default"))')
  expect(dsnString).toContain('(clearance 50 (type "class gap"))')
  expect(reparsedJson.structure.rule.clearances[0].type).toBe("kicad default")
  expect(reparsedJson.network.classes[0].rule.clearances[0].type).toBe(
    "class gap",
  )
})
