import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { convertCircuitJsonToDsnString, parseDsnToCircuitJson } from "lib"
import threeSubcircuitCircuitConnectedToSamePorts from "../assets/repro/three-subcircuit-connected-to-same-ports.json"

const hasPort = (ports: string[], portName: string) =>
  ports.some((portId) => portId.includes(portName))

const hasPorts = (ports: string[], portNames: string[]) =>
  portNames.every((portName) => hasPort(ports, portName))

test("circuit json -> dsn -> circuit json preserves subcircuit trace boundaries", async () => {
  const dsnFile = convertCircuitJsonToDsnString(
    threeSubcircuitCircuitConnectedToSamePorts as any,
  )
  const circuitJson = parseDsnToCircuitJson(dsnFile)

  const source_trace = su(circuitJson).source_trace.list()
  expect(source_trace.length).toBe(2)

  const pcb_trace = su(circuitJson).pcb_trace.list()
  expect(pcb_trace.length).toBe(1)
  expect(pcb_trace[0].source_trace_id).toBe(source_trace[0].source_trace_id)

  expect(hasPort(source_trace[0].connected_source_port_ids, "R1")).toBe(true)
  expect(hasPort(source_trace[0].connected_source_port_ids, "R2")).toBe(true)
  expect(hasPort(source_trace[0].connected_source_port_ids, "C1")).toBe(false)

  const outerSubcircuitTrace = source_trace.find((trace) =>
    hasPort(trace.connected_source_port_ids, "C1"),
  )

  expect(outerSubcircuitTrace).toBeDefined()
  expect(outerSubcircuitTrace!.connected_source_port_ids).toHaveLength(2)
  expect(hasPort(outerSubcircuitTrace!.connected_source_port_ids, "R1")).toBe(
    true,
  )
  expect(hasPort(outerSubcircuitTrace!.connected_source_port_ids, "R2")).toBe(
    false,
  )
})

test("circuit json -> dsn -> circuit json does not add a merged trace when shared-anchor branches are routed", async () => {
  const circuitWithOuterRoute = JSON.parse(
    JSON.stringify(threeSubcircuitCircuitConnectedToSamePorts),
  )
  circuitWithOuterRoute.push({
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_source_trace_1",
    source_trace_id: "source_trace_1",
    route: [
      {
        x: 2.5,
        y: 0,
        layer: "top",
        width: 0.16,
        route_type: "wire",
      },
      {
        x: -3.85,
        y: 0,
        layer: "top",
        width: 0.16,
        route_type: "wire",
      },
    ],
  })

  const dsnFile = convertCircuitJsonToDsnString(circuitWithOuterRoute as any)
  const circuitJson = parseDsnToCircuitJson(dsnFile)
  const source_trace = su(circuitJson).source_trace.list()

  expect(source_trace.length).toBe(2)
  expect(
    source_trace.some((trace) =>
      hasPorts(trace.connected_source_port_ids, ["R1", "R2", "C1"]),
    ),
  ).toBe(false)
  expect(
    source_trace.some((trace) =>
      hasPorts(trace.connected_source_port_ids, ["R1", "R2"]),
    ),
  ).toBe(true)
  expect(
    source_trace.some((trace) =>
      hasPorts(trace.connected_source_port_ids, ["R1", "C1"]),
    ),
  ).toBe(true)
})
