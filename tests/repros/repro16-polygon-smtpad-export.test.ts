import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertCircuitJsonToDsnJson, convertCircuitJsonToDsnString } from "lib"

const polygonPadCircuitJson = [
  {
    type: "source_component",
    source_component_id: "source_component_0",
    ftype: "simple_test_point",
    name: "TP1",
    supplier_part_numbers: {},
  },
  {
    type: "source_port",
    source_port_id: "source_port_0",
    name: "pin1",
    pin_number: 1,
    port_hints: ["1"],
    source_component_id: "source_component_0",
  },
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    thickness: 1.4,
    num_layers: 2,
    material: "fr4",
    width: 10,
    height: 10,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    center: { x: 0, y: 0 },
    width: 2,
    height: 2,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: false,
    source_component_id: "source_component_0",
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_0",
    pcb_component_id: "pcb_component_0",
    layers: ["top"],
    x: 0.4,
    y: 0.2,
    source_port_id: "source_port_0",
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_0",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_0",
    layer: "top",
    shape: "polygon",
    points: [
      { x: 0.1, y: 0.0 },
      { x: 0.7, y: 0.0 },
      { x: 0.6, y: 0.4 },
      { x: 0.2, y: 0.5 },
    ],
    port_hints: ["1"],
  },
] as AnyCircuitElement[]

test("polygon smt pad export writes finite padstack and pin coordinates", () => {
  const dsnJson = convertCircuitJsonToDsnJson(polygonPadCircuitJson)
  const dsnString = convertCircuitJsonToDsnString(polygonPadCircuitJson)

  expect(dsnString).not.toContain("NaN")

  const exportedPadstack = dsnJson.library.padstacks.find((padstack) =>
    padstack.name.startsWith("Cust[T]Pad_"),
  )
  expect(exportedPadstack).toBeDefined()
  expect(exportedPadstack?.shapes[0].shapeType).toBe("polygon")
  expect(
    exportedPadstack?.shapes[0].shapeType === "polygon" &&
      exportedPadstack.shapes[0].coordinates.every(Number.isFinite),
  ).toBe(true)

  const exportedPin = dsnJson.library.images[0]?.pins[0]
  expect(exportedPin).toBeDefined()
  expect(Number.isFinite(exportedPin?.x)).toBe(true)
  expect(Number.isFinite(exportedPin?.y)).toBe(true)
})

test("polygon smt pad visual repro", () => {
  expect(convertCircuitJsonToPcbSvg(polygonPadCircuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
