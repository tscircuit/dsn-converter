import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { convertPolylinePathToPcbTraces } from "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-polyline-path-to-pcb-traces"
import type { Wire } from "lib/dsn-pcb/types"
import { scale } from "transformation-matrix"

test("multi-segment polyline_path keeps route endpoints", () => {
  const wire: Wire = {
    net: "N1",
    type: "route",
    polyline_path: {
      layer: "F.Cu",
      width: 200,
      coordinates: [0, 0, 1000, 0, 1000, 0, 1000, 1000],
    },
  }

  const [trace] = convertPolylinePathToPcbTraces({
    wire,
    transformUmToMm: scale(1 / 1000),
    netName: "N1",
    fromSessionSpace: false,
  }) as PcbTrace[]

  expect(trace.route).toEqual([
    { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 1, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
  ])
  expect(trace.trace_length).toBe(2)
})
