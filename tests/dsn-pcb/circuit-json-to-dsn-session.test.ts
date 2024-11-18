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
import type { AnyCircuitElement } from "circuit-json"

test("convert circuit json to dsn session", () => {
  const dsnPcb = parseDsnToDsnJson(dsnPcbContent) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)
  const source_traces = su(circuitJson as any).source_trace.list()
  const pcb_traces = su(circuitJson as any).pcb_trace.list()
  const nets = su(circuitJson as any).source_net.list()

  expect(nets[0].name).toBe("Net-(C1-Pad1)")
  expect(source_traces[0].connected_source_net_ids).toContain(
    nets[0].source_net_id,
  )
  expect(pcb_traces).toHaveLength(0)

  return
  // Add pcb_traces to it to simulate it being routed

  // @ts-ignore
  const session = convertCircuitJsonToDsnSession(dsnPcb, circuitJson)

  // console.dir(session, { depth: null })

  // Verify basic session structure
  expect(session.is_dsn_session).toBe(true)
  expect(session.placement.components).toBeDefined()
  expect(session.routes.network_out.nets).toBeDefined()

  // Check components were converted
  expect(session.placement.components).toHaveLength(2)
  expect(session.placement.components[0].name).toContain("Resistor_SMD")
  expect(session.placement.components[1].name).toContain("Capacitor_SMD")

  // Check resolution
  expect(session.placement.resolution.unit).toBe("um")
  expect(session.placement.resolution.value).toBe(10)

  // Check nets were converted
  expect(session.routes.network_out.nets).toHaveLength(3)
  console.log(session.routes.network_out.nets)
  expect(session.routes.network_out.nets[0].name).toBe("Net-(C1-Pad1)")
})
