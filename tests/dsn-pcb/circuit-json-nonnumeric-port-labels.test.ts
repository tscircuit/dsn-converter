import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("exports nonnumeric source port labels to DSN pins and nets", () => {
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
      name: "D1",
      ftype: "simple_diode",
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
      source_port_id: "spA",
      source_component_id: "sc1",
      name: "A",
      port_hints: ["A"],
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "spC",
      source_component_id: "sc1",
      name: "C",
      port_hints: ["C"],
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "ppA",
      pcb_component_id: "pc1",
      source_port_id: "spA",
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "ppC",
      pcb_component_id: "pc1",
      source_port_id: "spC",
    } as AnyCircuitElement,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "padA",
      pcb_component_id: "pc1",
      pcb_port_id: "ppA",
      shape: "rect",
      x: -0.5,
      y: 0,
      width: 0.4,
      height: 0.6,
      layer: "top",
    } as AnyCircuitElement,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "padC",
      pcb_component_id: "pc1",
      pcb_port_id: "ppC",
      shape: "rect",
      x: 0.5,
      y: 0,
      width: 0.4,
      height: 0.6,
      layer: "top",
    } as AnyCircuitElement,
    {
      type: "source_trace",
      source_trace_id: "st1",
      connected_source_port_ids: ["spA", "spC"],
      connected_source_net_ids: [],
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.library.images[0].pins.map((pin) => pin.pin_number)).toEqual([
    "A",
    "C",
  ])
  expect(dsnJson.network.nets[0]).toMatchObject({
    name: "Net-(D1_sc1-PadA)",
    pins: ["D1_sc1-A", "D1_sc1-C"],
  })
})

test("exports nonnumeric plated-hole labels to DSN pins and nets", () => {
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
      name: "J1",
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
      source_port_id: "sp_plus",
      source_component_id: "sc1",
      name: "+",
      port_hints: ["+"],
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "sp_minus",
      source_component_id: "sc1",
      name: "-",
      port_hints: ["-"],
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp_plus",
      pcb_component_id: "pc1",
      source_port_id: "sp_plus",
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp_minus",
      pcb_component_id: "pc1",
      source_port_id: "sp_minus",
    } as AnyCircuitElement,
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole_plus",
      pcb_component_id: "pc1",
      pcb_port_id: "pp_plus",
      shape: "circle",
      x: -0.5,
      y: 0,
      outer_diameter: 1,
      hole_diameter: 0.7,
    } as AnyCircuitElement,
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole_minus",
      pcb_component_id: "pc1",
      pcb_port_id: "pp_minus",
      shape: "circle",
      x: 0.5,
      y: 0,
      outer_diameter: 1,
      hole_diameter: 0.7,
    } as AnyCircuitElement,
    {
      type: "source_trace",
      source_trace_id: "st1",
      connected_source_port_ids: ["sp_plus", "sp_minus"],
      connected_source_net_ids: [],
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.library.images[0].pins.map((pin) => pin.pin_number)).toEqual([
    "+",
    "-",
  ])
  expect(dsnJson.network.nets[0]).toMatchObject({
    name: "Net-(J1_sc1-Pad+)",
    pins: ["J1_sc1-+", "J1_sc1--"],
  })
})
