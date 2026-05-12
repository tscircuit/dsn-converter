import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("uses symbol display value as placement PN when present", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
    },
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "C1",
      ftype: "capacitor",
      capacitance: 1e-9,
      symbol_display_value: "1nF",
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 1, y: 2 },
      rotation: 0,
      layer: "top",
    } as any,
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "1",
      port_hints: ["1"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      source_port_id: "sp1",
      pcb_component_id: "pc1",
      x: 1,
      y: 2,
      layers: ["top"],
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: 1,
      y: 2,
      width: 0.6,
      height: 0.4,
      layer: "top",
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.placement.components[0].places[0].PN).toBe("1nF")
})
