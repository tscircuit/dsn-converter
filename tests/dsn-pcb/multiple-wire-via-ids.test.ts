import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

const dsnWithRepeatedPowerNetElements = `
(pcb repeated-power-net
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "dsn-converter-test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property (index 0))
    )
    (layer B.Cu
      (type signal)
      (property (index 1))
    )
    (boundary
      (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0)
    )
    (via Via[0-1]_600:300_um)
    (rule
      (width 200)
      (clearance 200)
    )
  )
  (placement)
  (library
    (padstack Via[0-1]_600:300_um
      (shape (circle F.Cu 600))
      (attach off)
    )
  )
  (network
    (net POWER
      (pins)
    )
    (class kicad_default "" POWER
      (circuit
        (use_via Via[0-1]_600:300_um)
      )
      (rule
        (width 200)
        (clearance 200)
      )
    )
  )
  (wiring
    (wire
      (path F.Cu 200 1000 1000 2000 1000)
      (net POWER)
      (type route)
    )
    (wire
      (path F.Cu 200 3000 1000 4000 1000)
      (net POWER)
      (type route)
    )
    (via Via[0-1]_600:300_um 5000 1000
      (net POWER)
    )
    (via Via[0-1]_600:300_um 6000 1000
      (net POWER)
    )
  )
)
`

test("multiple wires and vias on the same net use unique circuit-json ids", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithRepeatedPowerNetElements) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const pcbTraces = su(circuitJson).pcb_trace.list()
  const pcbVias = su(circuitJson).pcb_via.list()

  expect(pcbTraces).toHaveLength(2)
  expect(pcbVias).toHaveLength(2)

  expect(new Set(pcbTraces.map((trace) => trace.pcb_trace_id)).size).toBe(
    pcbTraces.length,
  )
  expect(new Set(pcbVias.map((via) => via.pcb_via_id)).size).toBe(
    pcbVias.length,
  )

  expect(pcbTraces.map((trace) => trace.pcb_trace_id)).toEqual([
    "pcb_trace_POWER",
    "pcb_trace_POWER_1",
  ])
  expect(pcbVias.map((via) => via.pcb_via_id)).toEqual([
    "pcb_via_POWER",
    "pcb_via_POWER_1",
  ])
  expect(pcbTraces.map((trace) => trace.source_trace_id)).toEqual([
    "POWER",
    "POWER",
  ])
})
