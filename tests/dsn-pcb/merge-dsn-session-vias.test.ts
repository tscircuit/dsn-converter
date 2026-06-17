import { expect, test } from "bun:test"
import type { DsnPcb, DsnSession } from "lib"
import { mergeDsnSessionIntoDsnPcb } from "lib"

test("preserves session vias when merging into a DSN PCB", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "board.dsn",
    parser: {
      string_quote: '"',
      host_version: "test",
      space_in_quoted_tokens: "on",
      host_cad: "test",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [],
      boundary: {
        path: { layer: "pcb", width: 0, coordinates: [] },
      },
      via: "Via[0-1]_600:300_um",
      rule: {
        clearances: [],
        width: 200,
      },
    },
    placement: { components: [] },
    library: {
      images: [],
      padstacks: [],
    },
    network: {
      nets: [],
      classes: [],
    },
    wiring: {
      wires: [
        {
          path: { layer: "F.Cu", width: 200, coordinates: [0, 0, 1000, 0] },
          net: "OLD",
          type: "route",
        },
      ],
    },
  }

  const session: DsnSession = {
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
        host_version: "test",
        space_in_quoted_tokens: "on",
        host_cad: "test",
      },
      network_out: {
        nets: [
          {
            name: "N1",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 2000,
                  coordinates: [0, 0, 30000, 0],
                },
                net: "N1",
                type: "route",
              },
            ],
            vias: [{ x: 15000, y: -5000 }],
          },
        ],
      },
    },
  }

  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcb, session)

  expect(mergedPcb.wiring.wires).toHaveLength(2)
  expect(mergedPcb.wiring.wires[0].path.coordinates).toEqual([0, 0, 3000, 0])
  expect(mergedPcb.wiring.wires[1]).toEqual({
    path: {
      layer: "all",
      width: 0,
      coordinates: [1500, -500],
    },
    net: "N1",
    type: "via",
  })
})
