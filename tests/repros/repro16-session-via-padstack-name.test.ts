import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import {
  type DsnPcb,
  type DsnSession,
  convertDsnSessionToCircuitJson,
} from "lib"

const baseDsnPcb: DsnPcb = {
  is_dsn_pcb: true,
  filename: "four-layer-session-via",
  parser: {
    string_quote: '"',
    space_in_quoted_tokens: "on",
    host_cad: "tscircuit",
    host_version: "test",
  },
  resolution: { unit: "um", value: 10 },
  unit: "um",
  structure: {
    layers: [
      { name: "F.Cu", type: "signal", property: { index: 0 } },
      { name: "In1.Cu", type: "signal", property: { index: 1 } },
      { name: "In2.Cu", type: "signal", property: { index: 2 } },
      { name: "B.Cu", type: "signal", property: { index: 3 } },
    ],
    boundary: {
      path: {
        layer: "F.Cu",
        width: 0,
        coordinates: [0, 0, 20000, 0, 20000, 20000, 0, 20000, 0, 0],
      },
    },
    via: "Via[0-3]_600:300_um",
    rule: { clearances: [], width: 1000 },
  },
  placement: { components: [] },
  library: { images: [], padstacks: [] },
  network: {
    nets: [{ name: "VBUS", pins: [] }],
    classes: [],
  },
  wiring: { wires: [] },
}

const sessionWithFourLayerVia: DsnSession = {
  is_dsn_session: true,
  filename: "four-layer-session-via",
  placement: {
    resolution: { unit: "um", value: 10 },
    components: [],
  },
  routes: {
    resolution: { unit: "um", value: 10 },
    parser: {
      string_quote: '"',
      space_in_quoted_tokens: "on",
      host_cad: "freerouting",
      host_version: "test",
    },
    library_out: {
      images: [],
      padstacks: [
        {
          name: "Via[0-3]_600:300_um",
          attach: "off",
          shapes: [
            { shapeType: "circle", layer: "F.Cu", diameter: 6000 },
            { shapeType: "circle", layer: "In1.Cu", diameter: 6000 },
            { shapeType: "circle", layer: "In2.Cu", diameter: 6000 },
            { shapeType: "circle", layer: "B.Cu", diameter: 6000 },
          ],
        },
      ],
    },
    network_out: {
      nets: [
        {
          name: "VBUS",
          wires: [
            {
              path: {
                layer: "F.Cu",
                width: 2000,
                coordinates: [0, 0, 10000, 0],
              },
              net: "VBUS",
              type: "route",
            },
          ],
          vias: [{ x: 10000, y: 0 }],
        },
      ],
    },
  },
}

test("converts session vias when the via padstack is not the hard-coded two-layer name", () => {
  const circuitJson = convertDsnSessionToCircuitJson(
    baseDsnPcb,
    sessionWithFourLayerVia,
  )

  const vias = su(circuitJson).pcb_via.list()
  expect(vias).toHaveLength(1)
  expect(vias[0]).toMatchObject({
    pcb_via_id: "pcb_via_VBUS_1_0",
    x: 1,
    y: 0,
    from_layer: "top",
    to_layer: "bottom",
  })
})
