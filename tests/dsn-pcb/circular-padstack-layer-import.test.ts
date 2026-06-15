import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson } from "lib"

test("imports layer-specific circular padstack shapes on their DSN layer", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "circle-layer.dsn",
    parser: {
      string_quote: "",
      space_in_quoted_tokens: "",
      host_cad: "",
      host_version: "",
    },
    resolution: { unit: "um", value: 10 },
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
          coordinates: [-1000, -1000, 1000, -1000, 1000, 1000, -1000, 1000],
        },
      },
      via: "Via[0-1]_600:300_um",
      rule: {
        width: 150,
        clearances: [{ value: 150 }],
      },
    },
    placement: {
      components: [
        {
          name: "LayeredCircle",
          places: [
            {
              refdes: "D1",
              x: 0,
              y: 0,
              side: "front",
              rotation: 0,
            },
          ],
        },
      ],
    },
    library: {
      images: [
        {
          name: "LayeredCircle",
          outlines: [],
          pins: [
            {
              padstack_name: "Round[B]Pad_1000_um",
              pin_number: 1,
              x: 0,
              y: 0,
            },
          ],
        },
      ],
      padstacks: [
        {
          name: "Round[B]Pad_1000_um",
          shapes: [
            {
              shapeType: "circle",
              layer: "B.Cu",
              diameter: 1000,
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

  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)
  const smtpad = circuitJson.find((element) => element.type === "pcb_smtpad")

  expect(smtpad).toMatchObject({
    type: "pcb_smtpad",
    shape: "circle",
    layer: "bottom",
    radius: 0.5,
  })
})
