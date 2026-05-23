import { expect, test } from "bun:test"
import { convertDsnPcbToCircuitJson } from "lib"
import type { DsnPcb } from "lib/dsn-pcb/types"

const baseDsnPcb: DsnPcb = {
  is_dsn_pcb: true,
  filename: "test.dsn",
  unit: "um",
  parser: { string_quote: '"', space_in_quoted_tokens: "false", host_cad: "", host_version: "" },
  resolution: { unit: "um", value: 1 },
  structure: {
    layers: [],
    boundary: {
      path: {
        layer: "pcb",
        width: 0,
        coordinates: [0, 0, 10000, 0, 10000, 10000, 0, 10000],
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
        name: "rotated-component",
        places: [
          {
            refdes: "U1",
            x: 10000,
            y: 10000,
            side: "front",
            rotation: 90,
            PN: "ROT",
          },
        ],
      },
    ],
  },
  library: {
    images: [
      {
        name: "rotated-component",
        outlines: [],
        pins: [
          {
            padstack_name: "rect-pad",
            pin_number: 1,
            x: 1000,
            y: 0,
          },
        ],
      },
    ],
    padstacks: [
      {
        name: "rect-pad",
        attach: "",
        shapes: [
          {
            shapeType: "rect",
            layer: "F.Cu",
            coordinates: [-1000, -500, 1000, 500],
          },
        ],
      },
    ],
  },
  network: { nets: [], classes: [] },
  wiring: { wires: [] },
}

test("component placement rotation is applied to generated pads and ports", () => {
  const circuitJson = convertDsnPcbToCircuitJson(baseDsnPcb)

  const pad = circuitJson.find((elm) => elm.type === "pcb_smtpad")
  const port = circuitJson.find((elm) => elm.type === "pcb_port")

  expect(pad).toMatchObject({
    x: 10,
    y: 11,
    width: 1,
    height: 2,
  })
  expect(port).toMatchObject({
    x: 10,
    y: 11,
  })
})
