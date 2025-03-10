import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnSession } from "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-session"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

// Test basic session structure
test("creates basic session structure", () => {
  const dsnPcb: DsnPcb = {
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

  const circuitJson: AnyCircuitElement[] = []

  const session = convertCircuitJsonToDsnSession(dsnPcb, circuitJson)

  expect(session.is_dsn_session).toBe(true)
  expect(session.filename).toBe("test.dsn")
  expect(session.placement.resolution).toEqual(dsnPcb.resolution)
  expect(session.routes.resolution).toEqual(dsnPcb.resolution)
  expect(session.routes.parser).toEqual(dsnPcb.parser)
})

// Test component placement conversion
test("converts component placement", () => {
  const dsnPcb: DsnPcb = {
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
      components: [
        {
          name: "R_0402",
          places: [
            {
              refdes: "R1",
              x: 1000,
              y: 2000,
              side: "front",
              rotation: 0,
              PN: "10k",
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
      wires: [],
    },
  }

  const circuitJson: AnyCircuitElement[] = []

  const session = convertCircuitJsonToDsnSession(dsnPcb, circuitJson)

  expect(session.placement.components).toHaveLength(1)
  expect(session.placement.components[0]).toEqual(
    dsnPcb.placement.components[0],
  )
})

// Test net and wire conversion
test("converts nets and wires", () => {
  const dsnPcb: DsnPcb = {
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
      nets: [
        {
          name: "Net-(R1-Pad1)",
          pins: ["R1-1", "C1-1"],
        },
      ],
      classes: [],
    },
    wiring: {
      wires: [
        {
          path: {
            layer: "F.Cu",
            width: 200,
            coordinates: [1000, 2000, 3000, 4000],
          },
          net: "Net-(R1-Pad1)",
          type: "route",
        },
      ],
    },
  }

  // Create minimal circuit elements needed for a net
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_net",
      source_net_id: "net1",
      name: "Net-(R1-Pad1)",
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

  const session = convertCircuitJsonToDsnSession(dsnPcb, circuitJson)

  expect(session.routes.network_out.nets).toHaveLength(1)
  expect(session.routes.network_out.nets[0].name).toBe("Net-(R1-Pad1)")
  expect(session.routes.network_out.nets[0].wires).toHaveLength(1)
  expect(session.routes.network_out.nets[0].wires[0].path).toEqual({
    layer: "F.Cu",
    width: 2000,
    coordinates: [10000, 20000, 30000, 40000],
  })
})
