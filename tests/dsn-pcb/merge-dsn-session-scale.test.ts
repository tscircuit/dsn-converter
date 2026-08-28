import { expect, test } from "bun:test"
import { type DsnPcb, type DsnSession, mergeDsnSessionIntoDsnPcb } from "lib"

const baseDsnPcb: DsnPcb = {
  is_dsn_pcb: true,
  filename: "merge-scale.dsn",
  parser: {
    string_quote: '"',
    space_in_quoted_tokens: "on",
    host_cad: "test",
    host_version: "1",
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
        coordinates: [0, 0, 2000, 0, 2000, 1000, 0, 1000, 0, 0],
      },
    },
    via: "ExistingVia[0-1]_600:300_um",
    rule: {
      width: 200,
      clearances: [{ value: 200 }],
    },
  },
  placement: {
    components: [],
  },
  library: {
    images: [],
    padstacks: [
      {
        name: "ExistingVia[0-1]_600:300_um",
        attach: "off",
        shapes: [
          {
            shapeType: "circle",
            layer: "F.Cu",
            diameter: 600,
          },
        ],
        hole: {
          shape: "circle",
          diameter: 300,
        },
      },
    ],
  },
  network: {
    nets: [{ name: "NET1", pins: [] }],
    classes: [
      {
        name: "kicad_default",
        description: "",
        net_names: ["NET1"],
        circuit: { use_via: "ExistingVia[0-1]_600:300_um" },
        rule: {
          width: 200,
          clearances: [{ value: 200 }],
        },
      },
    ],
  },
  wiring: {
    wires: [],
  },
}

test("mergeDsnSessionIntoDsnPcb scales new session library_out padstacks", () => {
  const session: DsnSession = {
    is_dsn_session: true,
    filename: "merge-scale.ses",
    placement: {
      resolution: baseDsnPcb.resolution,
      components: [],
    },
    routes: {
      resolution: baseDsnPcb.resolution,
      parser: baseDsnPcb.parser,
      library_out: {
        images: [],
        padstacks: [
          {
            name: "ExistingVia[0-1]_600:300_um",
            attach: "off",
            shapes: [
              {
                shapeType: "circle",
                layer: "F.Cu",
                diameter: 6000,
              },
            ],
            hole: {
              shape: "circle",
              diameter: 3000,
            },
          },
          {
            name: "SessionVia[0-1]_600:300_um",
            attach: "off",
            shapes: [
              {
                shapeType: "circle",
                layer: "F.Cu",
                diameter: 6000,
              },
              {
                shapeType: "rect",
                layer: "B.Cu",
                coordinates: [-3000, -2000, 3000, 2000],
              },
              {
                shapeType: "path",
                layer: "F.Cu",
                width: 2000,
                coordinates: [0, 0, 10000, 0],
              },
              {
                shapeType: "polygon",
                layer: "B.Cu",
                width: 1000,
                coordinates: [0, 0, 10000, 0, 10000, 5000],
              },
            ],
            hole: {
              shape: "oval",
              width: 3000,
              height: 5000,
            },
          },
        ],
      },
      network_out: {
        nets: [],
      },
    },
  }

  const mergedPcb = mergeDsnSessionIntoDsnPcb(baseDsnPcb, session)
  const existingPadstack = mergedPcb.library.padstacks.find(
    (padstack) => padstack.name === "ExistingVia[0-1]_600:300_um",
  )
  const mergedPadstack = mergedPcb.library.padstacks.find(
    (padstack) => padstack.name === "SessionVia[0-1]_600:300_um",
  )

  expect(mergedPcb.library.padstacks).toHaveLength(2)
  expect(existingPadstack?.shapes).toEqual([
    {
      shapeType: "circle",
      layer: "F.Cu",
      diameter: 600,
    },
  ])
  expect(existingPadstack?.hole).toEqual({
    shape: "circle",
    diameter: 300,
  })
  expect(mergedPadstack?.shapes).toEqual([
    {
      shapeType: "circle",
      layer: "F.Cu",
      diameter: 600,
    },
    {
      shapeType: "rect",
      layer: "B.Cu",
      coordinates: [-300, -200, 300, 200],
    },
    {
      shapeType: "path",
      layer: "F.Cu",
      width: 200,
      coordinates: [0, 0, 1000, 0],
    },
    {
      shapeType: "polygon",
      layer: "B.Cu",
      width: 100,
      coordinates: [0, 0, 1000, 0, 1000, 500],
    },
  ])
  expect(mergedPadstack?.hole).toEqual({
    shape: "oval",
    width: 300,
    height: 500,
  })
})
