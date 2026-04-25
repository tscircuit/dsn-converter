import { expect, test } from "bun:test"
import { parseDsnToDsnJson } from "lib"
import { convertDsnSessionToCircuitJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-session-to-circuit-json"
import type { DsnPcb, DsnSession } from "lib"
import type { PcbTrace } from "circuit-json"
import { readFileSync } from "node:fs"
import { join } from "node:path"

test("DSN session conversion computes pcb_trace.trace_length", () => {
  const dsnContent = readFileSync(
    join(import.meta.dir, "../assets/freerouting-sessions/circuit1.dsn"),
    "utf8",
  )
  const sessionContent = readFileSync(
    join(import.meta.dir, "../assets/freerouting-sessions/session1.ses"),
    "utf8",
  )

  const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
  const sessionJson = parseDsnToDsnJson(sessionContent) as DsnSession
  const circuitJson = convertDsnSessionToCircuitJson(dsnJson, sessionJson)

  const traces = circuitJson.filter(
    (el): el is PcbTrace => el.type === "pcb_trace",
  )

  expect(traces.length).toBeGreaterThan(0)

  for (const trace of traces) {
    // Every pcb_trace must have a trace_length field
    expect(trace.trace_length).toBeDefined()
    expect(typeof trace.trace_length).toBe("number")
    // trace_length must be positive and match the sum of segment lengths
    expect(trace.trace_length).toBeGreaterThan(0)
  }

  // Verify a specific trace has the correct length
  const wirePoints = traces[0].route.filter((r) => r.route_type === "wire")
  if (wirePoints.length >= 2) {
    let expectedLength = 0
    for (let i = 0; i < wirePoints.length - 1; i++) {
      const dx = wirePoints[i + 1].x - wirePoints[i].x
      const dy = wirePoints[i + 1].y - wirePoints[i].y
      expectedLength += Math.sqrt(dx * dx + dy * dy)
    }
    expect(traces[0].trace_length).toBeCloseTo(expectedLength, 3)
  }
})
