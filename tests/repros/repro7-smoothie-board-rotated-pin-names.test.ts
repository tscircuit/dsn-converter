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
