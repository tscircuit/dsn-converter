import { expect, test } from "bun:test"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
import type { DsnPcb } from "../../lib/dsn-pcb/types.ts"

test("converts DSN path padstack shapes using stroked path extents", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "path-padstack.dsn",
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
        {
          name: "Top",
          type: "signal",
          property: { index: 0 },
        },
      ],
      boundary: {
        path: {
          layer: "Top",
          width: 0,
          coordinates: [-5000, -5000, 5000, -5000, 5000, 5000, -5000, 5000],
        },
      },
      via: "",
      rule: {
        width: 100,
        clearances: [],
      },
    },
    placement: {
      components: [
        {
          name: "OVAL_FOOTPRINT",
          places: [
            {
              refdes: "J1",
              x: 0,
              y: 0,
              side: "front",
              rotation: 0,
              PN: "",
            },
          ],
        },
      ],
    },
    library: {
      images: [
        {
          name: "OVAL_FOOTPRINT",
          outlines: [],
          pins: [
            {
              padstack_name: "Oval[A]Pad_2844.8x1422.4_um",
              pin_number: 1,
              x: 0,
              y: 0,
            },
          ],
        },
      ],
      padstacks: [
        {
          name: "Oval[A]Pad_2844.8x1422.4_um",
          attach: "off",
          shapes: [
            {
              shapeType: "path",
              layer: "Top",
              width: 1422.4,
              coordinates: [-711.2, 0, 711.2, 0],
            },
          ],
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

  const circuitJson = convertDsnJsonToCircuitJson(dsnPcb)
  const [pad] = circuitJson.filter((element) => element.type === "pcb_smtpad")

  expect(pad).toMatchObject({
    type: "pcb_smtpad",
    shape: "rect",
    width: 2.8448,
    height: 1.4224,
  })
})
