import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { scale } from "transformation-matrix"
import { convertDsnSessionToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-session-to-circuit-json"
import { convertPolylinePathToPcbTraces } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-polyline-path-to-pcb-traces"
import { convertWiringPathToPcbTraces } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wiring-path-to-pcb-traces"
import { parseDsnToDsnJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb, DsnSession } from "../../lib/dsn-pcb/types"
import { getTraceLength } from "../../lib/utils/get-trace-length"

test("computes pcb_trace.trace_length for wiring paths, polyline paths, and session traces", async () => {
  const transformUmToMm = scale(1 / 1000)

  const pathElements = convertWiringPathToPcbTraces({
    wire: {
      net: "NET1",
      type: "route",
      path: {
        layer: "F.Cu",
        width: 200,
        coordinates: [0, 0, 3000, 0, 3000, 4000],
      },
    },
    transformUmToMm,
    netName: "NET1",
    fromSessionSpace: false,
  })
  const pathTrace = pathElements.find(
    (el): el is PcbTrace => el.type === "pcb_trace",
  )
  expect(pathTrace).toBeDefined()
  expect(pathTrace?.trace_length).toBe(7)

  const singleSegPolylineTraces = convertPolylinePathToPcbTraces({
    wire: {
      net: "NET2",
      type: "route",
      polyline_path: {
        layer: "F.Cu",
        width: 200,
        coordinates: [0, 0, 3000, 4000],
      },
    },
    transformUmToMm,
    netName: "NET2",
    fromSessionSpace: false,
  })
  expect(singleSegPolylineTraces).toHaveLength(1)
  expect(singleSegPolylineTraces[0]?.trace_length).toBe(5)

  const dsnFile = await Bun.file(
    "./tests/assets/freerouting-sessions/circuit1.dsn",
  ).text()
  const sessionFile = await Bun.file(
    "./tests/assets/freerouting-sessions/session1.ses",
  ).text()
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession

  const circuitJson = convertDsnSessionToCircuitJson(dsnJson, sessionJson)
  const pcbTraces = circuitJson.filter(
    (el): el is PcbTrace => el.type === "pcb_trace",
  )
  expect(pcbTraces.length).toBeGreaterThan(0)
  for (const trace of pcbTraces) {
    const wirePoints = trace.route
      .filter((pt) => pt.route_type === "wire")
      .map((pt) => ({ x: pt.x, y: pt.y }))
    expect(trace.trace_length).toBe(getTraceLength(wirePoints))
    expect(trace.trace_length).toBeGreaterThan(0)
  }
})
