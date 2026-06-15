import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("keeps rectangular plated-hole padstacks distinct by drill diameter", () => {
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
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole_small",
      pcb_component_id: "pc1",
      shape: "circular_hole_with_rect_pad",
      x: -0.5,
      y: 0,
      rect_pad_width: 1.6,
      rect_pad_height: 1,
      hole_diameter: 0.6,
    } as AnyCircuitElement,
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole_large",
      pcb_component_id: "pc1",
      shape: "circular_hole_with_rect_pad",
      x: 0.5,
      y: 0,
      rect_pad_width: 1.6,
      rect_pad_height: 1,
      hole_diameter: 0.9,
    } as AnyCircuitElement,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const rectHolePadstacks = dsnJson.library.padstacks.filter((padstack) =>
    padstack.name.startsWith("RoundRect[A]Pad_1600x1000_"),
  )

  expect(rectHolePadstacks.map((padstack) => padstack.name).sort()).toEqual([
    "RoundRect[A]Pad_1600x1000_600_um",
    "RoundRect[A]Pad_1600x1000_900_um",
  ])
  expect(
    rectHolePadstacks.map((padstack) => padstack.hole?.diameter).sort(),
  ).toEqual([600, 900])
  expect(
    dsnJson.library.images[0].pins.map((pin) => pin.padstack_name),
  ).toEqual([
    "RoundRect[A]Pad_1600x1000_600_um",
    "RoundRect[A]Pad_1600x1000_900_um",
  ])
})
