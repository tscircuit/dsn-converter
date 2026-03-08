import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("component with 180° rotation has correct DSN placement rotation and pin positions", () => {
  // A simple resistor rotated 180°. At 0° rotation, pad1 would be at
  // (2.5, 0) and pad2 at (3.5, 0). At 180°, world positions flip:
  // pad1 at (3.5, 0) and pad2 at (2.5, 0), but center stays at (3, 0).
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "sc_0",
      name: "R1",
      ftype: "simple_resistor",
    } as any,
    {
      type: "source_port",
      source_port_id: "sp_0",
      source_component_id: "sc_0",
      name: "pin1",
      port_hints: ["1"],
    } as any,
    {
      type: "source_port",
      source_port_id: "sp_1",
      source_component_id: "sc_0",
      name: "pin2",
      port_hints: ["2"],
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pc_0",
      source_component_id: "sc_0",
      center: { x: 3, y: 0 },
      rotation: 180,
      width: 1,
      height: 0.6,
      layer: "top",
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pp_0",
      source_port_id: "sp_0",
      pcb_component_id: "pc_0",
      x: 3.5,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pp_1",
      source_port_id: "sp_1",
      pcb_component_id: "pc_0",
      x: 2.5,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "ps_0",
      pcb_component_id: "pc_0",
      pcb_port_id: "pp_0",
      shape: "rect",
      x: 3.5,
      y: 0,
      width: 0.6,
      height: 0.6,
      layer: "top",
      port_hints: ["1"],
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "ps_1",
      pcb_component_id: "pc_0",
      pcb_port_id: "pp_1",
      shape: "rect",
      x: 2.5,
      y: 0,
      width: 0.6,
      height: 0.6,
      layer: "top",
      port_hints: ["2"],
    } as any,
  ]

  const dsnString = convertCircuitJsonToDsnString(circuitJson)
  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb

  // The placement rotation should be 180, not 0
  const component = dsnJson.placement.components[0]
  expect(component.places[0].rotation).toBe(180)

  // Image pin positions should be in local (unrotated) coordinates.
  // World: pad1 at (3.5, 0) relative to center (3,0) = (0.5, 0)
  // Un-rotated by 180°: (-0.5, 0) → in µm: (-500, 0)
  const image = dsnJson.library.images.find(
    (img) => img.name === component.name,
  )!
  const pin1 = image.pins.find((p) => p.pin_number === "1" || p.pin_number === 1)!
  const pin2 = image.pins.find((p) => p.pin_number === "2" || p.pin_number === 2)!

  expect(pin1.x).toBeCloseTo(-500, 0)
  expect(pin1.y).toBeCloseTo(0, 0)
  expect(pin2.x).toBeCloseTo(500, 0)
  expect(pin2.y).toBeCloseTo(0, 0)
})
