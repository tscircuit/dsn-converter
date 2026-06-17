import { expect, test } from "bun:test"
import type { PcbTrace, PcbVia } from "circuit-json"
import {
  type DsnPcb,
  type DsnSession,
  convertDsnSessionToCircuitJson,
} from "lib"

const emptyDsnPcb: DsnPcb = {
  is_dsn_pcb: true,
  filename: "session-via-trace-linkage",
  parser: {
    string_quote: '"',
    host_version: "",
    space_in_quoted_tokens: "on",
    host_cad: "test",
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
        layer: "F.Cu",
        width: 0,
        coordinates: [
          -10000, -10000, 10000, -10000, 10000, 10000, -10000, 10000,
        ],
      },
    },
    via: "Via[0-1]_600:300_um",
    rule: { clearances: [], width: 0 },
  },
  placement: { components: [] },
  library: { images: [], padstacks: [] },
  network: { nets: [], classes: [] },
  wiring: { wires: [] },
}

test("session vias link to an emitted pcb_trace id", () => {
  const session: DsnSession = {
    is_dsn_session: true,
    filename: "session-via-trace-linkage",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: '"',
        host_version: "",
        space_in_quoted_tokens: "on",
        host_cad: "test",
      },
      library_out: {
        images: [],
        padstacks: [
          {
            name: "Via[0-1]_600:300_um",
            attach: "off",
            shapes: [
              { shapeType: "circle", layer: "F.Cu", diameter: 6000 },
              { shapeType: "circle", layer: "B.Cu", diameter: 6000 },
            ],
          },
        ],
      },
      network_out: {
        nets: [
          {
            name: "NET_A",
            wires: [
              {
                path: {
                  layer: "F.Cu",
                  width: 1000,
                  coordinates: [0, 0, 10000, 0],
                },
              },
              {
                path: {
                  layer: "B.Cu",
                  width: 1000,
                  coordinates: [10000, 0, 20000, 0],
                },
              },
            ],
            vias: [{ x: 10000, y: 0 }],
          },
        ],
      },
    },
  }

  const circuitJson = convertDsnSessionToCircuitJson(emptyDsnPcb, session)
  const traces = circuitJson.filter(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )
  const vias = circuitJson.filter(
    (element): element is PcbVia => element.type === "pcb_via",
  )

  expect(vias).toHaveLength(1)
  const via = vias[0]!
  expect(via.pcb_trace_id).toBeDefined()
  const linkedTraceId = via.pcb_trace_id!
  expect(traces.map((trace) => trace.pcb_trace_id)).toContain(linkedTraceId)

  const linkedTrace = traces.find(
    (trace) => trace.pcb_trace_id === linkedTraceId,
  )
  expect(linkedTrace?.route.some((point) => point.route_type === "via")).toBe(
    true,
  )
})
