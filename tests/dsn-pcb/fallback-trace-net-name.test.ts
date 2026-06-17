import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnSession } from "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-session"
import type { DsnPcb } from "lib/dsn-pcb/types"

function createEmptyDsnPcb(): DsnPcb {
  return {
    is_dsn_pcb: true,
    filename: "test.dsn",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    resolution: {
      unit: "um",
      value: 10,
    },
    unit: "um",
    structure: {
      layers: [],
      boundary: {
        path: {
          layer: "pcb",
          width: 0,
          coordinates: [],
        },
      },
      via: "",
      rule: {
        width: 0,
        clearances: [],
      },
    },
    placement: {
      components: [],
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
      wires: [],
    },
  }
}

test("uses generated net id for traces without source net or connected ports", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_empty",
      connected_source_net_ids: [],
      connected_source_port_ids: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_empty",
      source_trace_id: "source_trace_empty",
      route: [
        {
          route_type: "wire",
          x: 1,
          y: 2,
          width: 0.2,
          layer: "top",
        },
        {
          route_type: "wire",
          x: 3,
          y: 4,
          width: 0.2,
          layer: "top",
        },
      ],
    },
  ]

  const session = convertCircuitJsonToDsnSession(
    createEmptyDsnPcb(),
    circuitJson,
  )

  expect(session.routes.network_out.nets).toHaveLength(1)
  expect(session.routes.network_out.nets[0].name).toBe("Net-1")
  expect(session.routes.network_out.nets[0].name).not.toContain("--")
  expect(session.routes.network_out.nets[0].wires[0].path).toEqual({
    layer: "F.Cu",
    width: 2000,
    coordinates: [10000, 20000, 30000, 40000],
  })
})
