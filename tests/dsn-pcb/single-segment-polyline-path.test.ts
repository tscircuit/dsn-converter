import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

test("converts single-segment DSN polyline_path wires to route points", () => {
  const dsn = `(pcb single-polyline-path-test
    (parser
      (string_quote "")
      (space_in_quoted_tokens on)
      (host_cad "dsn-converter-test")
      (host_version "1")
    )
    (resolution um 10)
    (unit um)
    (structure
      (layer F.Cu (type signal) (property (index 0)))
      (layer B.Cu (type signal) (property (index 1)))
      (boundary (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0))
      (via Via[0-1]_600:300_um)
      (rule (width 200))
    )
    (placement)
    (library)
    (network
      (net SINGLE_SEGMENT_NET (pins))
      (class kicad_default SINGLE_SEGMENT_NET
        (circuit (use_via Via[0-1]_600:300_um))
        (rule (width 200))
      )
    )
    (wiring
      (wire
        (polyline_path F.Cu 200
          0 0 10000 0
        )
        (net SINGLE_SEGMENT_NET)
      )
    )
  )`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const trace = circuitJson.find(
    (element) =>
      element.type === "pcb_trace" &&
      element.pcb_trace_id === "pcb_trace_SINGLE_SEGMENT_NET",
  ) as PcbTrace | undefined

  expect(trace?.route).toHaveLength(2)
  expect(trace?.route).toEqual([
    { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 10, y: 0, width: 0.2, layer: "top" },
  ])
  expect(trace?.trace_length).toBe(10)
})
