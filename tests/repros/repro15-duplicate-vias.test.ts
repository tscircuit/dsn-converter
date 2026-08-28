import { expect, test } from "bun:test"
import { convertDsnSessionToCircuitJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-session-to-circuit-json"
import type { DsnPcb, DsnSession } from "lib/dsn-pcb/types"

test("duplicate vias from freerouting session are deduplicated", () => {
  // Minimal DsnPcb input with two layers and one net
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "test.dsn",
    parser: {
      string_quote: '"',
      host_version: "test",
      space_in_quoted_tokens: "on",
      host_cad: "test",
    },
    resolution: { unit: "um", value: 10000 },
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
          coordinates: [0, 0, 100000, 0, 100000, 100000, 0, 100000],
        },
      },
      via: "Via[0-1]_600:300_um",
      rule: { clearances: [{ value: 200 }], width: 250 },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: { nets: [], classes: [] },
    wiring: { wires: [] },
  }

  // Session with duplicate vias at the same coordinates within one net
  const dsnSession: DsnSession = {
    is_dsn_session: true,
    filename: "test.ses",
    placement: {
      resolution: { unit: "um", value: 10000 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10000 },
      parser: {
        string_quote: '"',
        host_version: "test",
        space_in_quoted_tokens: "on",
        host_cad: "test",
      },
      library_out: {
        images: [],
        padstacks: [
          {
            name: "Via[0-1]_600:300_um",
            shapes: [
              { shapeType: "circle", layer: "F.Cu", diameter: 600 },
              { shapeType: "circle", layer: "B.Cu", diameter: 600 },
            ],
            attach: "off",
          },
        ],
      },
      network_out: {
        nets: [
          {
            name: "TestNet",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 250,
                  coordinates: [10000, 20000, 30000, 20000],
                },
              },
              {
                path: {
                  layer: "B.Cu",
                  width: 250,
                  coordinates: [30000, 20000, 50000, 20000],
                },
              },
            ],
            // Freerouting sometimes outputs duplicate vias at the same location
            vias: [
              { x: 30000, y: 20000 },
              { x: 30000, y: 20000 }, // duplicate
              { x: 30000, y: 20000 }, // another duplicate
            ],
          },
        ],
      },
    },
  }

  const result = convertDsnSessionToCircuitJson(dsnPcb, dsnSession)

  const pcbVias = result.filter((el) => el.type === "pcb_via")

  // Should only have 1 via even though 3 were in the input
  expect(pcbVias.length).toBe(1)
})

test("duplicate vias across different nets are deduplicated", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "test.dsn",
    parser: {
      string_quote: '"',
      host_version: "test",
      space_in_quoted_tokens: "on",
      host_cad: "test",
    },
    resolution: { unit: "um", value: 10000 },
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
          coordinates: [0, 0, 100000, 0, 100000, 100000, 0, 100000],
        },
      },
      via: "Via[0-1]_600:300_um",
      rule: { clearances: [{ value: 200 }], width: 250 },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: { nets: [], classes: [] },
    wiring: { wires: [] },
  }

  const dsnSession: DsnSession = {
    is_dsn_session: true,
    filename: "test.ses",
    placement: {
      resolution: { unit: "um", value: 10000 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10000 },
      parser: {
        string_quote: '"',
        host_version: "test",
        space_in_quoted_tokens: "on",
        host_cad: "test",
      },
      library_out: {
        images: [],
        padstacks: [
          {
            name: "Via[0-1]_600:300_um",
            shapes: [
              { shapeType: "circle", layer: "F.Cu", diameter: 600 },
              { shapeType: "circle", layer: "B.Cu", diameter: 600 },
            ],
            attach: "off",
          },
        ],
      },
      network_out: {
        nets: [
          {
            name: "Net1",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 250,
                  coordinates: [10000, 20000, 30000, 20000],
                },
              },
            ],
            vias: [
              { x: 30000, y: 20000 },
              { x: 50000, y: 40000 },
            ],
          },
          {
            name: "Net2",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 250,
                  coordinates: [30000, 20000, 60000, 20000],
                },
              },
            ],
            // Same coordinates as Net1's first via
            vias: [{ x: 30000, y: 20000 }],
          },
        ],
      },
    },
  }

  const result = convertDsnSessionToCircuitJson(dsnPcb, dsnSession)

  const pcbVias = result.filter((el) => el.type === "pcb_via")

  // Should have 2 unique vias (30000,20000) and (50000,40000), not 3
  expect(pcbVias.length).toBe(2)
})
