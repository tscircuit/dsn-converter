import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

test("converts shove_fixed DSN wires to pcb traces", () => {
  const dsn = `(pcb fixed-wire-test
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
      (net N1 (pins))
      (class kicad_default N1
        (circuit (use_via Via[0-1]_600:300_um))
        (rule (width 200))
      )
    )
    (wiring
      (wire
        (path F.Cu 200 0 0 10000 0)
        (net N1)
        (clearance_class kicad_default)
        (type shove_fixed)
      )
    )
  )`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.wiring.wires[0].type).toBe("shove_fixed")

  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")

  expect(traces).toHaveLength(1)
  expect(traces[0]!.route).toEqual([
    { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 10, y: 0, width: 0.2, layer: "top" },
  ])
})
