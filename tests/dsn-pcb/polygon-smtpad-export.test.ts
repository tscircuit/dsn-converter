import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import type { DsnPcb } from "lib"

test("polygon smtpad exports without NaN values", () => {
  const polygonCircuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      width: 10,
      height: 10,
      center: { x: 0, y: 0 },
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "src1",
      center: { x: 0, y: 0 },
      rotation: 0,
    } as any,
    {
      type: "source_component",
      source_component_id: "src1",
      name: "U1",
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "comp1",
      pcb_port_id: "port1",
      shape: "polygon",
      points: [
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0, y: 0.5 },
      ],
      layer: "top",
      port_hints: ["1"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "port1",
      source_port_id: "source_port_1",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_1",
      port_hints: ["1"],
    } as any,
  ]

  const dsnFile = convertCircuitJsonToDsnString(polygonCircuitJson)

  expect(dsnFile).not.toContain("NaN")

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  expect(dsnJson.library.images[0].pins[0]).toMatchObject({
    x: 0,
    y: 0,
  })
  expect(dsnJson.library.padstacks[1]?.shapes[0]).toMatchObject({
    shapeType: "polygon",
    layer: "F.Cu",
    coordinates: [-500, -500, 500, -500, 0, 500, -500, -500],
  })
})
