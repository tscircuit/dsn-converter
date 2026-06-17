import { expect, test } from "bun:test"
import { parseDsnToCircuitJson } from "lib"

const twoPlacementDsn = `(pcb "component-id-test"
  (parser (string_quote ") (space_in_quoted_tokens on) (host_cad "test") (host_version "1"))
  (resolution um 10)
  (unit um)
  (structure
    (layer Top (type signal) (property (index 0)))
    (boundary (path Top 0 0 0 10000 0 10000 10000 0 10000 0 0))
    (via Via[0-0]_600:300_um)
    (rule (width 100) (clearance 100))
  )
  (placement
    (component U_LIB
      (place U1 1000 2000 front 0)
      (place U2 3000 2000 front 0)
    )
  )
  (library
    (image U_LIB
      (pin RectPad 1 0 0)
    )
    (padstack RectPad
      (shape (rect Top -500 -250 500 250))
    )
  )
  (network
    (net N1 (pins U1-1 U2-1))
  )
  (wiring)
)`

test("dsn pcb ports use placement-specific component ids", () => {
  const circuitJson = parseDsnToCircuitJson(twoPlacementDsn)
  const smtPads = circuitJson.filter((element) => element.type === "pcb_smtpad")
  const pcbPorts = circuitJson.filter((element) => element.type === "pcb_port")

  expect(smtPads.map((pad) => pad.pcb_component_id).sort()).toEqual([
    "U_LIB_U1",
    "U_LIB_U2",
  ])
  expect(pcbPorts.map((port) => port.pcb_component_id).sort()).toEqual([
    "U_LIB_U1",
    "U_LIB_U2",
  ])

  for (const smtPad of smtPads) {
    const pcbPort = pcbPorts.find(
      (port) => port.pcb_port_id === smtPad.pcb_port_id,
    )
    expect(pcbPort?.pcb_component_id).toBe(smtPad.pcb_component_id)
  }
})
