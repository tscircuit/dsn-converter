import { expect, test } from "bun:test"
import type { SourcePort, SourceTrace } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard rotated pin identifiers are preserved", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const c7Ports = sourcePorts.filter((port) => port.name.startsWith("C7-"))

  expect(c7Ports.map((port) => port.name).sort()).toEqual(["C7-A", "C7-C"])
  expect(c7Ports.some((port) => port.name === "C7-rotate")).toBe(false)

  const c7Anode = c7Ports.find((port) => port.name === "C7-A")
  const c7Cathode = c7Ports.find((port) => port.name === "C7-C")
  expect(c7Anode).toBeDefined()
  expect(c7Cathode).toBeDefined()

  const sourceTraces = circuitJson.filter(
    (element): element is SourceTrace => element.type === "source_trace",
  )
  const threeVoltTrace = sourceTraces.find((element) =>
    element.connected_source_net_ids.includes("source_net_3.3"),
  )
  const agndTrace = sourceTraces.find((element) =>
    element.connected_source_net_ids.includes("source_net_AGND"),
  )

  expect(threeVoltTrace?.connected_source_port_ids).toContain(
    c7Anode!.source_port_id,
  )
  expect(agndTrace?.connected_source_port_ids).toContain(
    c7Cathode!.source_port_id,
  )
})

test("smoothieboard special pin identifiers are preserved and connected", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const sourceTraces = circuitJson.filter(
    (element): element is SourceTrace => element.type === "source_trace",
  )

  const sourcePortByName = new Map(
    sourcePorts.map((port) => [port.name, port] as const),
  )
  const traceByNetName = new Map(
    sourceTraces.map((trace) => [
      trace.connected_source_net_ids[0].replace(/^source_net_/, ""),
      trace,
    ]),
  )

  expect(sourcePortByName.has("C60--")).toBe(true)
  expect(sourcePortByName.has("C60-NaN")).toBe(false)
  expect(sourcePortByName.has("IC11-2@1")).toBe(true)

  const sourcePortIds = sourcePorts.map((port) => port.source_port_id)
  expect(new Set(sourcePortIds).size).toBe(sourcePortIds.length)

  const expectedConnections = [
    { net: "AGND", port: "C60--" },
    { net: "AGND", port: "IC11-2@1" },
    { net: "Net-(R9-Pad1)", port: "X14-D-" },
    { net: "/smoothieboard-5driver_3/RD-", port: "RJ1-RD-" },
    { net: "/smoothieboard-5driver_3/TD-", port: "RJ1-TD-" },
    { net: "Net-(R50-Pad2)", port: "RJ1-Y-" },
    { net: "Net-(R61-Pad2)", port: "RJ1-G-" },
  ]

  for (const { net, port } of expectedConnections) {
    const sourcePort = sourcePortByName.get(port)
    expect(sourcePort).toBeDefined()
    expect(traceByNetName.get(net)?.connected_source_port_ids).toContain(
      sourcePort!.source_port_id,
    )
  }
})
