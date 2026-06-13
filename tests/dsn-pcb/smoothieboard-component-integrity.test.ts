import { expect, test } from "bun:test"
import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPort,
  PcbSmtPad,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

function primaryId(element: AnyCircuitElement) {
  return Object.entries(element).find(
    ([key]) => key === `${element.type}_id`,
  )?.[1]
}

function collectNumberPaths(value: unknown, path: string, result: string[]) {
  if (typeof value === "number") {
    if (Number.isNaN(value)) result.push(path)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      collectNumberPaths(child, `${path}[${index}]`, result),
    )
    return
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectNumberPaths(child, `${path}.${key}`, result)
    }
  }
}

test("smoothieboard conversion emits usable component, pad, and port links", () => {
  const dsnJson = parseDsnToDsnJson(smoothieDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const pcbComponents = circuitJson.filter(
    (element): element is PcbComponent => element.type === "pcb_component",
  )
  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const pcbPorts = circuitJson.filter(
    (element): element is PcbPort => element.type === "pcb_port",
  )
  const pcbSmtPads = circuitJson.filter(
    (element): element is PcbSmtPad => element.type === "pcb_smtpad",
  )

  expect(pcbComponents).toHaveLength(322)
  expect(pcbSmtPads).toHaveLength(1055)
  expect(pcbPorts).toHaveLength(1055)
  expect(sourcePorts).toHaveLength(1055)

  const pcbComponentIds = new Set(
    pcbComponents.map((component) => component.pcb_component_id),
  )

  for (const pad of pcbSmtPads) {
    expect(pcbComponentIds.has(pad.pcb_component_id!)).toBe(true)
  }
  for (const port of pcbPorts) {
    expect(pcbComponentIds.has(port.pcb_component_id!)).toBe(true)
  }

  const nanPaths: string[] = []
  circuitJson.forEach((element, index) =>
    collectNumberPaths(element, `circuitJson[${index}]`, nanPaths),
  )
  expect(nanPaths).toEqual([])

  const primaryIds = circuitJson
    .map(primaryId)
    .filter((id): id is string => typeof id === "string")
  expect(primaryIds.filter((id) => id.includes("NaN"))).toEqual([])
  expect(new Set(primaryIds).size).toBe(primaryIds.length)
})

test("smoothieboard keeps symbolic pins linkable without numeric pin_number NaN", () => {
  const dsnJson = parseDsnToDsnJson(smoothieDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const sourceTraces = circuitJson.filter(
    (element): element is SourceTrace => element.type === "source_trace",
  )

  const c84Plus = sourcePorts.find((port) => port.name === "C84-+")
  const c84Minus = sourcePorts.find((port) => port.name === "C84--")
  const x14DMinus = sourcePorts.find((port) => port.name === "X14-D-")

  expect(c84Plus?.pin_number).toBeUndefined()
  expect(c84Plus?.port_hints).toEqual(["+"])
  expect(c84Minus?.pin_number).toBeUndefined()
  expect(c84Minus?.port_hints).toEqual(["-"])
  expect(x14DMinus).toBeDefined()

  const r9Net = sourceTraces.find((trace) =>
    trace.connected_source_port_ids.includes(x14DMinus?.source_port_id ?? ""),
  )

  expect(r9Net?.connected_source_port_ids.length).toBeGreaterThanOrEqual(2)
})
