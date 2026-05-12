import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson } from "lib"

test("imports Bottom padstack shapes as bottom SMT pads", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "bottom-padstack.dsn",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
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
          coordinates: [-1000, -1000, 1000, -1000, 1000, 1000, -1000, 1000],
        },
      },
      via: "",
      rule: {
        width: 0,
        clearances: [],
      },
    },
    placement: {
      components: [
        {
          name: "BottomPadImage",
          places: [
            {
              refdes: "U1",
              x: 0,
              y: 0,
              side: "back",
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
          name: "BottomPadImage",
          outlines: [],
          pins: [
            {
              padstack_name: "BottomRectPad",
              pin_number: 1,
              x: 0,
              y: 0,
            },
          ],
        },
      ],
      padstacks: [
        {
          name: "BottomRectPad",
          shapes: [
            {
              shapeType: "rect",
              layer: "Bottom",
              coordinates: [-500, -250, 500, 250],
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

  expect(smtpad).toBeDefined()
  expect(smtpad?.layer).toBe("bottom")
})
