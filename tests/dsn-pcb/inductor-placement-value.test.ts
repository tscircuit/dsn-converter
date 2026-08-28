import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("exports simple inductor inductance as placement PN", () => {
  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "source_component_0",
      name: "L1",
      ftype: "simple_inductor",
      inductance: 4.7e-6,
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      source_component_id: "source_component_0",
      name: "pin1",
      pin_number: 1,
      port_hints: ["1"],
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_0",
      name: "pin2",
      pin_number: 2,
      port_hints: ["2"],
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 2,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      width: 1.6,
      height: 0.8,
      layer: "top",
      rotation: 0,
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_0",
      x: -0.5,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_1",
      x: 0.5,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_0",
      layer: "top",
      shape: "rect",
      width: 0.5,
      height: 0.5,
      x: -0.5,
      y: 0,
      port_hints: ["1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_1",
      layer: "top",
      shape: "rect",
      width: 0.5,
      height: 0.5,
      x: 0.5,
      y: 0,
      port_hints: ["2"],
    },
  ] as AnyCircuitElement[]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.placement.components).toHaveLength(1)
  expect(dsnJson.placement.components[0].places[0].PN).toBe("4.7uH")
})
