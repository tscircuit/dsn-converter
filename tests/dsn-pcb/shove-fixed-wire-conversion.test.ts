import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { DsnPcb } from "lib"
import { parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

test("converts shove_fixed DSN wires to pcb traces", () => {
  const dsnText = `(pcb test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary
      (path pcb 0 -5000 -5000 5000 -5000 5000 5000 -5000 5000 -5000 -5000)
    )
    (via "Via[0-1]_600:300_um")
    (rule (width 200) (clearance 200))
  )
  (placement)
  (library)
  (network
    (net "N1" (pins))
    (class kicad_default "" "N1"
      (circuit (use_via "Via[0-1]_600:300_um"))
      (rule (width 200) (clearance 200))
    )
  )
  (wiring
    (wire
      (path F.Cu 200 0 0 2000 0)
      (net "N1")
      (type shove_fixed)
    )
  )
)`

  const dsnJson = parseDsnToDsnJson(dsnText) as DsnPcb
  expect(dsnJson.wiring.wires[0].type).toBe("shove_fixed")

  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const pcbTraces = circuitJson.filter(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )

  expect(pcbTraces).toHaveLength(1)
  expect(pcbTraces[0].source_trace_id).toBe("N1")
  expect(pcbTraces[0].route).toHaveLength(2)
})
