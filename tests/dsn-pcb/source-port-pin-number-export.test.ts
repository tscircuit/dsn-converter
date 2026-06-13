import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("uses source_port pin_number when exporting DSN pins and nets", () => {
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
      name: "IO5",
      pin_number: 5,
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "sp2",
      source_component_id: "sc1",
      name: "IO7",
      pin_number: 7,
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      source_port_id: "sp1",
      pcb_component_id: "pc1",
      x: -0.5,
      y: 0,
      layers: ["top"],
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp2",
      source_port_id: "sp2",
      pcb_component_id: "pc1",
      x: 0.5,
      y: 0,
      layers: ["top"],
    } as AnyCircuitElement,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: -0.5,
      y: 0,
      width: 0.5,
      height: 0.5,
      layer: "top",
    } as AnyCircuitElement,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad2",
      pcb_component_id: "pc1",
      pcb_port_id: "pp2",
      shape: "rect",
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.5,
      layer: "top",
    } as AnyCircuitElement,
    {
      type: "source_trace",
      source_trace_id: "st1",
      connected_source_port_ids: ["sp1", "sp2"],
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const imagePins = dsnJson.library.images[0].pins.map((pin) => pin.pin_number)
  const net = dsnJson.network.nets.find(
    (net) => net.name === "Net-(U1_sc1-Pad5)",
  )

  expect(imagePins).toEqual([5, 7])
  expect(net?.pins).toEqual(["U1_sc1-5", "U1_sc1-7"])
})
