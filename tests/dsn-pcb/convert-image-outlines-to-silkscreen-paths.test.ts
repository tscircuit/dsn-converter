import { expect, test } from "bun:test"
import type { DsnPcb } from "lib/dsn-pcb/types"
import { convertDsnPcbToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-pcb-to-circuit-json"

const createPcbWithImageOutline = (): DsnPcb => ({
  is_dsn_pcb: true,
  filename: "image-outline.dsn",
  parser: {
    string_quote: '"',
    host_version: "",
    space_in_quoted_tokens: "",
    host_cad: "",
  },
  resolution: {
    unit: "um",
    value: 1,
  },
  unit: "um",
  structure: {
    layers: [
      { name: "F.Cu", type: "signal", property: { index: 0 } },
      { name: "B.Cu", type: "signal", property: { index: 1 } },
    ],
    boundary: {
      path: {
        layer: "signal",
        width: 0,
        coordinates: [
          -10000, -10000, 10000, -10000, 10000, 10000, -10000, 10000,
        ],
      },
    },
    via: "Via[0-1]_600:300_um",
    rule: {
      clearances: [],
      width: 100,
    },
  },
  placement: {
    components: [
      {
        name: "TestFootprint",
        places: [
          {
            refdes: "U1",
            x: 10000,
            y: 20000,
            side: "front",
            rotation: 90,
          },
          {
            refdes: "U2",
            x: 0,
            y: 0,
            side: "back",
            rotation: 0,
          },
        ],
      },
    ],
  },
  library: {
    images: [
      {
        name: "TestFootprint",
        outlines: [
          {
            path: {
              layer: "signal",
              width: 100,
              coordinates: [0, 0, 1000, 0, 1000, 1000],
            },
          },
        ],
        pins: [],
      },
    ],
    padstacks: [],
  },
  network: {
    nets: [],
    classes: [],
  },
  wiring: {
    wires: [],
  },
})

test("converts placed DSN image outlines to silkscreen paths", () => {
  const circuitJson = convertDsnPcbToCircuitJson(createPcbWithImageOutline())
  const silkscreenPaths = circuitJson.filter(
    (element) => element.type === "pcb_silkscreen_path",
  )

  expect(silkscreenPaths).toHaveLength(2)
  expect(silkscreenPaths[0]).toMatchObject({
    type: "pcb_silkscreen_path",
    pcb_component_id: "TestFootprint_U1",
    layer: "top",
    stroke_width: 0.1,
    route: [
      { x: 10, y: 20 },
      { x: 10, y: 21 },
      { x: 9, y: 21 },
    ],
  })
  expect(silkscreenPaths[1]).toMatchObject({
    pcb_component_id: "TestFootprint_U2",
    layer: "bottom",
    route: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  })
})
