import { expect, test } from "bun:test"
import { scale } from "transformation-matrix"
import { convertWiringPathToPcbTraces } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wiring-path-to-pcb-traces"
import type { Wiring } from "../../lib/dsn-pcb/types"

test("hyphenated DSN wire net names keep pcb traces linked to source traces", () => {
  const wire: Wiring["wires"][number] = {
    type: "route",
    net: "Net-(R1-Pad1)",
    path: {
      layer: "F.Cu",
      width: 200,
      coordinates: [0, 0, 1000, 0],
    },
  }

  const circuitElements = convertWiringPathToPcbTraces({
    wire,
    transformUmToMm: scale(1 / 1000),
    netName: "Net-(R1-Pad1)",
    fromSessionSpace: false,
  })

  const pcbTrace = circuitElements.find(
    (element) => element.type === "pcb_trace",
  )
  const sourceTrace = circuitElements.find(
    (element) => element.type === "source_trace",
  )

  if (!pcbTrace || !sourceTrace) {
    throw new Error("Expected a pcb_trace and source_trace")
  }

  expect(pcbTrace.source_trace_id).toBe("Net-(R1-Pad1)")
  expect(sourceTrace.source_trace_id).toBe("Net-(R1-Pad1)")
  expect(pcbTrace.source_trace_id).toBe(sourceTrace.source_trace_id)
})
