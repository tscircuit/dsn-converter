import { expect, test } from "bun:test"
import { type DsnPcb, stringifyDsnJson } from "lib"

test("omits missing rule widths instead of emitting undefined", () => {
  const dsnJson = {
    is_dsn_pcb: true,
    filename: "missing-rule-width.dsn",
    parser: {
      string_quote: "",
      space_in_quoted_tokens: "on",
      host_cad: "test",
      host_version: "1",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [],
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
      },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: {
      nets: [],
      classes: [
        {
          name: "no_width",
          description: "",
          net_names: [],
          circuit: { use_via: "Via[0-1]_600:300_um" },
          rule: {
            clearances: [{ value: 75 }],
          },
        },
        {
          name: "with_width",
          description: "",
          net_names: [],
          circuit: { use_via: "Via[0-1]_600:300_um" },
          rule: {
            width: 42,
            clearances: [{ value: 25 }],
          },
        },
      ],
    },
    wiring: { wires: [] },
  } as unknown as DsnPcb

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).not.toContain("(width undefined)")
  expect(dsnString).toContain("(clearance 150)")
  expect(dsnString).toContain("(clearance 75)")
  expect(dsnString).toContain("(width 42)")
})
