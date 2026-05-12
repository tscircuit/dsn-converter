import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("uses crystal and resonator frequencies as DSN placement values", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 20,
      height: 10,
      thickness: 1.4,
      num_layers: 2,
    } as any,
    {
      type: "source_component",
      source_component_id: "source_component_y1",
      name: "Y1",
      ftype: "simple_crystal",
      frequency: 16_000_000,
    } as any,
    {
      type: "source_component",
      source_component_id: "source_component_x1",
      name: "X1",
      ftype: "simple_resonator",
      frequency: 32_768,
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_y1",
      source_component_id: "source_component_y1",
      center: { x: -2, y: 0 },
      width: 3.2,
      height: 2.5,
      rotation: 0,
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_x1",
      source_component_id: "source_component_x1",
      center: { x: 2, y: 0 },
      width: 2,
      height: 1.6,
      rotation: 0,
    } as any,
    ...componentPorts("source_component_y1", "pcb_component_y1", "y1", -2),
    ...componentPorts("source_component_x1", "pcb_component_x1", "x1", 2),
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const places = dsnJson.placement.components.flatMap(
    (component) => component.places,
  )

  expect(
    places.find((place) => place.refdes === "Y1_source_component_y1")?.PN,
  ).toBe("16MHz")
  expect(
    places.find((place) => place.refdes === "X1_source_component_x1")?.PN,
  ).toBe("32.768kHz")
})

function componentPorts(
  sourceComponentId: string,
  pcbComponentId: string,
  idPrefix: string,
  centerX: number,
): AnyCircuitElement[] {
  return [
    {
      type: "source_port",
      source_port_id: `source_port_${idPrefix}_1`,
      source_component_id: sourceComponentId,
      name: "pin1",
      port_hints: ["1"],
    } as any,
    {
      type: "source_port",
      source_port_id: `source_port_${idPrefix}_2`,
      source_component_id: sourceComponentId,
      name: "pin2",
      port_hints: ["2"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: `pcb_port_${idPrefix}_1`,
      source_port_id: `source_port_${idPrefix}_1`,
      x: centerX - 0.6,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: `pcb_port_${idPrefix}_2`,
      source_port_id: `source_port_${idPrefix}_2`,
      x: centerX + 0.6,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: `pcb_smtpad_${idPrefix}_1`,
      pcb_component_id: pcbComponentId,
      pcb_port_id: `pcb_port_${idPrefix}_1`,
      layer: "top",
      shape: "rect",
      x: centerX - 0.6,
      y: 0,
      width: 0.5,
      height: 1,
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: `pcb_smtpad_${idPrefix}_2`,
      pcb_component_id: pcbComponentId,
      pcb_port_id: `pcb_port_${idPrefix}_2`,
      layer: "top",
      shape: "rect",
      x: centerX + 0.6,
      y: 0,
      width: 0.5,
      height: 1,
    } as any,
  ]
}
