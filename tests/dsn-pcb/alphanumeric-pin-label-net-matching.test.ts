import { expect, test } from "bun:test"
import type { PcbSmtPad, SourcePort, SourceTrace } from "circuit-json"
import { parseDsnToCircuitJson } from "lib"

const dsnWithAlphanumericPinLabels = `
(pcb alphanumeric_pin_label
  (resolution um 10)
  (unit um)
  (structure
    (layer Top (type signal))
    (boundary (path pcb 0 0 0 3000 0 3000 3000 0 3000 0 0))
  )
  (placement
    (component U_PART
      (place U1 1000 1000 front 0 PN)
    )
    (component J_PART
      (place J1 2000 1000 front 0 PN)
    )
  )
  (library
    (image U_PART
      (pin Rect[T]Pad_100x100_um 1A 0 0)
    )
    (image J_PART
      (pin Rect[T]Pad_100x100_um 2B 0 0)
    )
    (padstack Rect[T]Pad_100x100_um
      (shape (rect Top -50 -50 50 50))
    )
  )
  (network
    (net 3.3V (pins U1-1A J1-2B))
    (class default "" 3.3V (circuit (use_via "")) (rule (width 100) (clearance 100)))
  )
  (wiring)
)
`

test("keeps alphanumeric DSN pin labels intact for ports, pads, and net matching", () => {
  const circuitJson = parseDsnToCircuitJson(dsnWithAlphanumericPinLabels)

  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const smtPads = circuitJson.filter(
    (element): element is PcbSmtPad => element.type === "pcb_smtpad",
  )
  const sourceTrace = circuitJson.find(
    (element): element is SourceTrace =>
      element.type === "source_trace" &&
      element.connected_source_net_ids.includes("source_net_3.3V"),
  )

  const u1Port = sourcePorts.find((port) => port.name === "U1-1A")
  const j1Port = sourcePorts.find((port) => port.name === "J1-2B")

  expect(u1Port).toBeDefined()
  expect(j1Port).toBeDefined()
  expect(u1Port?.pin_number).toBeUndefined()
  expect(j1Port?.pin_number).toBeUndefined()
  expect(u1Port?.port_hints).toEqual(["1A"])
  expect(j1Port?.port_hints).toEqual(["2B"])
  expect(sourceTrace?.connected_source_net_ids).toEqual(["source_net_3.3V"])
  expect(sourceTrace?.connected_source_port_ids).toEqual([
    u1Port!.source_port_id,
    j1Port!.source_port_id,
  ])
  expect(smtPads.map((pad) => pad.pcb_smtpad_id).sort()).toEqual([
    "pcb_smtpad_J_PART_J1_2B",
    "pcb_smtpad_U_PART_U1_1A",
  ])
})
