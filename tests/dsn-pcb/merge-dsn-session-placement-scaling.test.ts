import { expect, test } from "bun:test"
import type { DsnPcb, DsnSession } from "lib"
import { mergeDsnSessionIntoDsnPcb } from "lib"

test("scales session placements when merging into a DSN PCB", () => {
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
    placement: {
      components: [
        {
          name: "R_0402",
          places: [
            {
              refdes: "R1",
              x: 3000,
              y: -1000,
              side: "front",
              rotation: 0,
              PN: "1k",
            },
          ],
        },
      ],
    },
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
      components: [
        {
          name: "R_0402",
          places: [
            {
              refdes: "R1",
              x: 30000,
              y: -10000,
              side: "front",
              rotation: 90,
              PN: "1k",
            },
          ],
        },
      ],
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
          },
        ],
      },
    },
  }

  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcb, session)

  expect(mergedPcb.placement.components[0].places[0]).toMatchObject({
    refdes: "R1",
    x: 3000,
    y: -1000,
    rotation: 90,
  })
  expect(mergedPcb.wiring.wires[0].path.coordinates).toEqual([0, 0, 3000, 0])
})
