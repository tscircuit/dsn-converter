import { expect, test } from "bun:test"
import { type DsnPcb, type DsnSession, mergeDsnSessionIntoDsnPcb } from "lib"

test("merge session scales wire widths with coordinates", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "board.dsn",
    parser: {
      string_quote: '"',
      space_in_quoted_tokens: "on",
      host_cad: "KiCad",
      host_version: "8",
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
          coordinates: [0, 0, 1000, 0, 1000, 1000, 0, 1000, 0, 0],
        },
      },
      via: "Via[0-1]_600:300_um",
      rule: { clearances: [], width: 100 },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: {
      nets: [{ name: "N1", pins: [] }],
      classes: [
        {
          name: "default",
          description: "",
          net_names: ["N1"],
          circuit: { use_via: "Via[0-1]_600:300_um" },
          rule: { clearances: [], width: 100 },
        },
      ],
    },
    wiring: { wires: [] },
  }

  const dsnSession: DsnSession = {
    is_dsn_session: true,
    filename: "board.ses",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: '"',
        space_in_quoted_tokens: "on",
        host_cad: "Freerouting",
        host_version: "1",
      },
      network_out: {
        nets: [
          {
            name: "N1",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 2500,
                  coordinates: [0, 0, 10000, 0],
                },
                net: "N1",
                type: "route",
              },
            ],
          },
        ],
      },
    },
  }

  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcb, dsnSession)

  expect(mergedPcb.wiring.wires[0].path).toEqual({
    layer: "F.Cu",
    width: 250,
    coordinates: [0, 0, 1000, 0],
  })
})
