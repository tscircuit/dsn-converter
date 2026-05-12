import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("exports bottom-layer SMT components as back-side DSN placements", () => {
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
      name: "R1",
      ftype: "simple_resistor",
      resistance: 1000,
    } as AnyCircuitElement,
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 0, y: 0 },
      rotation: 0,
      layer: "bottom",
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "pin1",
      port_hints: ["1"],
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      pcb_component_id: "pc1",
      source_port_id: "sp1",
    } as AnyCircuitElement,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: 0,
      y: 0,
      width: 0.4,
      height: 0.6,
      layer: "bottom",
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.placement.components[0].places[0].side).toBe("back")
  expect(dsnJson.library.images[0].pins[0].padstack_name).toBe(
    "RoundRect[B]Pad_400x600_um",
  )
})
