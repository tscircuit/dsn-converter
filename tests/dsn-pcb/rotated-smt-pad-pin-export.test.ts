import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson, stringifyDsnJson } from "lib"

test("exports rotated rectangular SMT pads with pin rotation", () => {
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
      shape: "rotated_rect",
      x: 0,
      y: 0,
      width: 1,
      height: 0.5,
      ccw_rotation: 90,
      layer: "top",
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const pin = dsnJson.library.images[0].pins[0]

  expect(pin).toMatchObject({
    padstack_name: "RoundRect[T]Pad_1000x500_um",
    pin_number: "1",
    rotation: 90,
    x: 0,
    y: 0,
  })
  expect(stringifyDsnJson(dsnJson)).toContain(
    "(pin RoundRect[T]Pad_1000x500_um (rotate 90) 1 0 0)",
  )
})
