import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

test("maps DSN Top, Bottom, and inner wire layer names to circuit layers", () => {
  const dsn = `(pcb layer-name-test
    (parser
      (string_quote "")
      (space_in_quoted_tokens on)
      (host_cad "dsn-converter-test")
      (host_version "1")
    )
    (resolution um 10)
    (unit um)
    (structure
      (layer Top (type signal) (property (index 0)))
      (layer In7.Cu (type signal) (property (index 7)))
      (layer Bottom (type signal) (property (index 1)))
      (boundary (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0))
      (via Via[0-1]_600:300_um)
      (rule (width 200))
    )
    (placement)
    (library)
    (network
      (net TOP_NET (pins))
      (net INNER7_NET (pins))
      (net BOTTOM_NET (pins))
      (class kicad_default TOP_NET INNER7_NET BOTTOM_NET
        (circuit (use_via Via[0-1]_600:300_um))
        (rule (width 200))
      )
    )
    (wiring
      (wire
        (path Top 200 0 0 10000 0)
        (net TOP_NET)
      )
      (wire
        (path In7.Cu 200 0 2000 10000 2000)
        (net INNER7_NET)
      )
      (wire
        (polyline_path Bottom 200
          0 0 10000 0
          5000 -5000 5000 5000
        )
        (net BOTTOM_NET)
      )
    )
  )`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const topTrace = traces.find(
    (trace) => trace.pcb_trace_id === "pcb_trace_TOP_NET",
  )
  const bottomTrace = traces.find(
    (trace) => trace.pcb_trace_id === "pcb_trace_BOTTOM_NET",
  )
  const inner7Trace = traces.find(
    (trace) => trace.pcb_trace_id === "pcb_trace_INNER7_NET",
  )

  expect(
    topTrace?.route.every(
      (point) => point.route_type === "wire" && point.layer === "top",
    ),
  ).toBe(true)
  expect(
    bottomTrace?.route.every(
      (point) => point.route_type === "wire" && point.layer === "bottom",
    ),
  ).toBe(true)
  expect(
    inner7Trace?.route.every(
      (point) =>
        point.route_type === "wire" && (point.layer as string) === "inner7",
    ),
  ).toBe(true)
})
