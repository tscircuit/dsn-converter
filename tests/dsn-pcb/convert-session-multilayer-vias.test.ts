import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbTrace, PcbVia } from "circuit-json"
import { convertCircuitJsonToDsnSession } from "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-session"
import { convertDsnSessionToCircuitJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-session-to-circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("convertDsnSessionToCircuitJson preserves 4-layer Via[0-3] vias and parses custom via padstack dimensions", () => {
  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "test-4layer.dsn",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
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
          layer: "pcb",
          width: 0,
          coordinates: [-5000, -5000, 5000, -5000, 5000, 5000, -5000, 5000],
        },
      },
      via: "Via[0-3]_800:400_um",
      rule: { width: 200, clearances: [] },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: { nets: [{ name: "NET1", pins: [] }], classes: [] },
    wiring: { wires: [] },
  }

  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_net",
      source_net_id: "net1",
      name: "NET1",
      member_source_group_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "trace1",
      connected_source_net_ids: ["net1"],
      connected_source_port_ids: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace1",
      source_trace_id: "trace1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
        {
          route_type: "via",
          x: 1,
          y: 1,
          from_layer: "top",
          to_layer: "bottom",
        },
        { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "bottom" },
        { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "bottom" },
      ],
    },
  ]

  const session = convertCircuitJsonToDsnSession(dsnPcb, circuitJson)
  session.routes.library_out!.padstacks[0].name = "Via[0-3]_800:400_um"
  session.routes.network_out.nets[0].vias![0].padstack_name =
    "Via[0-3]_800:400_um"

  const converted = convertDsnSessionToCircuitJson(dsnPcb, session, circuitJson)
  const vias = converted.filter((e): e is PcbVia => e.type === "pcb_via")
  expect(vias).toHaveLength(1)
  expect(vias[0].outer_diameter).toBe(0.8)
  expect(vias[0].hole_diameter).toBe(0.4)
  expect(vias[0].from_layer).toBe("top")
  expect(vias[0].to_layer).toBe("bottom")

  const traces = converted.filter((e): e is PcbTrace => e.type === "pcb_trace")
  expect(
    traces.some((t) => t.route.some((pt) => pt.route_type === "via")),
  ).toBe(true)
})
