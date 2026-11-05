import { expect, test } from "bun:test"
import type { PcbTrace, PcbVia } from "circuit-json"
import { scale } from "transformation-matrix"
import { convertWiresToPcbTraces } from "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wires-to-traces"
import { mergeDsnSessionIntoDsnPcb } from "lib/dsn-pcb/dsn-json-to-circuit-json/merge-dsn-session-into-dsn-pcb"
import type { DsnPcb, DsnSession } from "lib/dsn-pcb/types"

test("convertWiresToPcbTraces maps In1.Cu/In2.Cu to inner1/inner2 and handles 1-segment polyline_path wires", () => {
  const elements = convertWiresToPcbTraces(
    {
      wires: [
        {
          path: {
            layer: "In1.Cu",
            width: 200,
            coordinates: [0, 0, 1000, 2000],
          },
          net: "NET_INNER_PATH",
          type: "route",
        },
        {
          polyline_path: {
            layer: "In2.Cu",
            width: 250,
            coordinates: [1000, 2000, 3000, 4000],
          },
          net: "NET_INNER_POLY",
          type: "route",
        },
      ],
    },
    {
      nets: [
        { name: "NET_INNER_PATH", pins: [] },
        { name: "NET_INNER_POLY", pins: [] },
      ],
      classes: [],
    },
    scale(1 / 1000),
    false,
  )

  const traces = elements.filter((e): e is PcbTrace => e.type === "pcb_trace")
  expect(traces).toHaveLength(2)
  expect(traces[0].route[0]).toMatchObject({
    route_type: "wire",
    layer: "inner1",
    x: 0,
    y: 0,
  })
  expect(traces[1].route).toEqual([
    {
      route_type: "wire",
      layer: "inner2",
      width: 0.25,
      x: 1,
      y: 2,
    },
    {
      route_type: "wire",
      layer: "inner2",
      width: 0.25,
      x: 3,
      y: 4,
    },
  ])
})

test("mergeDsnSessionIntoDsnPcb preserves polyline_path wires and session vias", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "board.dsn",
    parser: {
      string_quote: '"',
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [
        { name: "F.Cu", type: "signal", property: { index: 0 } },
        { name: "B.Cu", type: "signal", property: { index: 1 } },
      ],
      boundary: { path: { layer: "pcb", width: 0, coordinates: [] } },
      via: "Via[0-1]_600:300_um",
      rule: { width: 200, clearances: [] },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: { nets: [{ name: "N1", pins: [] }], classes: [] },
    wiring: { wires: [] },
  }

  const session: DsnSession = {
    is_dsn_session: true,
    filename: "board.ses",
    placement: { resolution: { unit: "um", value: 10 }, components: [] },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: dsnPcb.parser,
      network_out: {
        nets: [
          {
            name: "N1",
            wires: [
              {
                polyline_path: {
                  layer: "F.Cu",
                  width: 2000,
                  coordinates: [10000, 20000, 30000, 40000],
                },
              },
            ],
            vias: [{ x: 30000, y: 40000 }],
          },
        ],
      },
    },
  }

  const merged = mergeDsnSessionIntoDsnPcb(dsnPcb, session)
  expect(merged.wiring.wires).toHaveLength(2)
  expect(merged.wiring.wires[0]).toMatchObject({
    polyline_path: {
      layer: "F.Cu",
      width: 200,
      coordinates: [1000, 2000, 3000, 4000],
    },
    net: "N1",
    type: "route",
  })
  expect(merged.wiring.wires[1]).toMatchObject({
    path: {
      layer: "F.Cu",
      width: 600,
      coordinates: [3000, 4000],
    },
    net: "N1",
    type: "via",
  })

  const elements = convertWiresToPcbTraces(
    merged.wiring,
    merged.network,
    scale(1 / 1000),
    false,
  )
  expect(elements.some((e): e is PcbVia => e.type === "pcb_via")).toBe(true)
})
