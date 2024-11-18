import { su } from "@tscircuit/soup-util"
import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnSession,
  convertDsnJsonToCircuitJson,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
  type DsnPcb,
} from "lib"
// @ts-ignore
import dsnPcbContent from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
import type { AnyCircuitElement, PcbTrace } from "circuit-json"

test("convert circuit json to dsn session", () => {
  const dsnPcb = parseDsnToDsnJson(dsnPcbContent) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)
  const source_traces = su(circuitJson as any).source_trace.list()
  const pcb_traces = su(circuitJson as any).pcb_trace.list()
  const nets = su(circuitJson as any).source_net.list()
  const source_ports = su(circuitJson as any).source_port.list()
  const pcb_ports = su(circuitJson as any).pcb_port.list()
  const source_components = su(circuitJson as any).source_component.list()

  expect(nets[0].name).toBe("Net-(C1-Pad1)")
  expect(source_traces[0].connected_source_net_ids).toContain(
    nets[0].source_net_id,
  )
  expect(pcb_traces).toHaveLength(0)

  // Create a direct-line connection between the pads that need to be connected
  const pcbTracesFromAutorouting: PcbTrace[] = [
    {
      pcb_trace_id: "pcb_trace_1",
      type: "pcb_trace",
      source_trace_id: source_traces[0].source_trace_id,
      route: [
        {
          start_pcb_port_id: pcb_ports[0].pcb_port_id,
          route_type: "wire",
          x: pcb_ports[0].x,
          y: pcb_ports[0].y,
          width: 0.1,
          layer: pcb_ports[0].layers[0],
        },
        {
          end_pcb_port_id: pcb_ports[1].pcb_port_id,
          route_type: "wire",
          x: pcb_ports[1].x,
          y: pcb_ports[1].y,
          width: 0.1,
          layer: pcb_ports[1].layers[0],
          start_pcb_port_id: pcb_ports[1].pcb_port_id,
        },
      ],
    },
  ]

  const session = convertCircuitJsonToDsnSession(
    dsnPcb,
    circuitJson.concat(pcbTracesFromAutorouting),
  )

  // console.log(session)

  // console.dir(session, { depth: null })

  // Verify basic session structure
  expect(session.is_dsn_session).toBe(true)
  expect(session.placement.components).toBeDefined()
  expect(session.routes.network_out.nets).toBeDefined()

  // Check components were converted
  expect(session.placement.components).toHaveLength(2)
  const componentNames = session.placement.components.map((c) => c.name)
  expect(componentNames.join(",")).toContain("Resistor_SMD")
  expect(componentNames.join(",")).toContain("Capacitor_SMD")

  // Check resolution
  expect(session.placement.resolution.unit).toBe("um")
  expect(session.placement.resolution.value).toBe(10)

  // Check nets were converted
  expect(session.routes.network_out.nets).toHaveLength(1)
  expect(session.routes.network_out.nets[0].name).toBe("Net-(C1-Pad1)")
})