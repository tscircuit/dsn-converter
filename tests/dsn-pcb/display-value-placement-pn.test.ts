import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("exports source component display_value as placement PN", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      width: 10,
      height: 10,
      center: { x: 0, y: 0 },
      num_layers: 2,
    } as AnyCircuitElement,
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "U1",
      ftype: "simple_chip",
      display_value: "ATmega328P-AU",
    } as AnyCircuitElement,
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 0, y: 0 },
      rotation: 0,
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "1",
      port_hints: ["1"],
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      source_port_id: "sp1",
      pcb_component_id: "pc1",
      x: 0,
      y: 0,
      layers: ["top"],
    } as AnyCircuitElement,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
      layer: "top",
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.placement.components[0].places[0].PN).toBe("ATmega328P-AU")
})
