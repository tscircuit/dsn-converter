import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("exports pill SMT pads as oval layer padstacks", () => {
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
      name: "LED1",
      ftype: "simple_resistor",
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
      shape: "pill",
      x: 0,
      y: 0,
      width: 1.6,
      height: 0.8,
      radius: 0.4,
      layer: "top",
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const padstack = dsnJson.library.padstacks.find(
    (padstack) => padstack.name === "Oval[T]Pad_1600x800_um",
  )

  expect(padstack).toBeDefined()
  expect(padstack?.hole).toBeUndefined()
  expect(padstack?.shapes).toEqual([
    {
      shapeType: "path",
      layer: "F.Cu",
      width: 800,
      coordinates: [-400, 0, 400, 0],
    },
  ])
  expect(dsnJson.library.images[0].pins[0].padstack_name).toBe(
    "Oval[T]Pad_1600x800_um",
  )
})
