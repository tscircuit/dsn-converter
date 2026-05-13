import { expect, test } from "bun:test"
import {
  type DsnPcb,
  type DsnSession,
  convertDsnSessionToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}

test("parse session file", () => {
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  expect(sessionJson).toBeTruthy()
  expect(sessionJson.filename).toBe("test2")

  // Check placement section
  expect(sessionJson.placement.components).toHaveLength(2)
  expect(sessionJson.placement.components[0].name).toBe(
    "Resistor_SMD:R_0402_1005Metric",
  )
  expect(sessionJson.placement.components[1].name).toBe(
    "Capacitor_SMD:C_0603_1608Metric",
  )

  // Check routes section exists
  expect(sessionJson.routes).toBeTruthy()

  // Check network_out wire paths
  const net = sessionJson.routes.network_out.nets[0]
  expect(net.name).toBe("Net-(R1-Pad1)")
  expect(net.wires).toHaveLength(3)

  // Check first wire path
  expect(net.wires[0].path).toEqual({
    layer: "F.Cu",
    width: 2000,
    coordinates: [25000, 0, 18983, 0],
  })

  // Check second wire path
  expect(net.wires[1].path).toEqual({
    layer: "F.Cu",
    width: 2000,
    coordinates: [-35000, 0, -35000, -6017],
  })

  // Check third wire path
  expect(net.wires[2].path).toEqual({
    layer: "F.Cu",
    width: 2000,
    coordinates: [-35000, -6017, 12966, -6017, 18983, 0],
  })

  // Check library_out section
  expect(sessionJson.routes.library_out).toBeTruthy()
  expect(sessionJson.routes.library_out?.padstacks).toHaveLength(2)

  // Check first padstack
  const firstPadstack = sessionJson.routes.library_out?.padstacks[0]
  expect(firstPadstack?.name).toBe("Via[0-1]_600:300_um")
  expect(firstPadstack?.shapes).toHaveLength(2)
  expect(firstPadstack?.shapes[0].shapeType).toBe("circle")
  expect(firstPadstack?.shapes[0].layer).toBe("F.Cu")
  expect((firstPadstack?.shapes[0] as any).diameter).toBe(6000)
})

test("parse and convert session polyline_path wires", () => {
  const sessionFileWithPolylinePath = `(session test
  (placement
    (resolution um 10)
  )
  (routes
    (resolution um 10)
    (parser
      (host_cad "")
      (host_version "")
    )
    (network_out
      (net N1
        (wire
          (polyline_path F.Cu 2000
            0 0 10000 0
            10000 -10000 10000 10000
            10000 10000 20000 10000
          )
        )
      )
    )
  )
)`

  const sessionJson = parseDsnToDsnJson(
    sessionFileWithPolylinePath,
  ) as DsnSession

  expect(sessionJson.routes.network_out.nets[0].wires[0].polyline_path).toEqual(
    {
      layer: "F.Cu",
      width: 2000,
      coordinates: [
        0, 0, 10000, 0, 10000, -10000, 10000, 10000, 10000, 10000, 20000, 10000,
      ],
    },
  )

  const dsnPcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "test.dsn",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [],
      boundary: { path: { layer: "pcb", width: 0, coordinates: [] } },
      via: "",
      rule: { width: 0, clearances: [] },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: { nets: [], classes: [] },
    wiring: { wires: [] },
  }

  const circuitJson = convertDsnSessionToCircuitJson(dsnPcb, sessionJson)
  const sessionTrace = circuitJson.find(
    (element) => element.type === "pcb_trace",
  )

  expect(sessionTrace).toMatchObject({
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_N1_0",
    route: [
      { route_type: "wire", x: 1, y: 0, width: 0.2, layer: "top" },
      { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
    ],
  })
})
