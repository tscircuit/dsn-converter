import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbSmtPadRotatedRect } from "circuit-json"
import {
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
import type { DsnPcb } from "lib"

const rotatedRectCircuitJson: AnyCircuitElement[] = [
  {
    type: "source_component",
    source_component_id: "source_component_0",
    ftype: "simple_chip",
    name: "U1",
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
    type: "source_port",
    source_port_id: "source_port_1",
    name: "pin2",
    pin_number: 2,
    port_hints: ["2"],
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
    width: 4,
    height: 4,
    layer: "top",
    rotation: 45,
    obstructs_within_bounds: false,
    source_component_id: "source_component_0",
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_0",
    pcb_component_id: "pcb_component_0",
    layers: ["top"],
    x: -1,
    y: -1,
    source_port_id: "source_port_0",
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_1",
    pcb_component_id: "pcb_component_0",
    layers: ["top"],
    x: 1,
    y: 1,
    source_port_id: "source_port_1",
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_0",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_0",
    layer: "top",
    shape: "rotated_rect",
    x: -1,
    y: -1,
    width: 2,
    height: 1,
    ccw_rotation: 45,
    port_hints: ["1"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_1",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_1",
    layer: "top",
    shape: "rotated_rect",
    x: 1,
    y: 1,
    width: 2,
    height: 1,
    ccw_rotation: 135,
    port_hints: ["2"],
  },
]

test("rotated_rect smt pads export rotated polygon padstacks and round-trip back to rotated_rect", () => {
  const dsnJson = convertCircuitJsonToDsnJson(rotatedRectCircuitJson)

  const padstack45 = dsnJson.library.padstacks.find(
    (p) => p.name === "RoundRect[T]Pad_2000x1000_45deg_um",
  )
  const padstack135 = dsnJson.library.padstacks.find(
    (p) => p.name === "RoundRect[T]Pad_2000x1000_135deg_um",
  )

  expect(padstack45).toBeDefined()
  expect(padstack135).toBeDefined()

  const shape45 = padstack45?.shapes[0]
  expect(shape45?.shapeType).toBe("polygon")
  if (shape45?.shapeType === "polygon") {
    // Unrotated top-left (-1000, 500) rotated +45 deg CCW -> (-1060.66, -353.553)
    expect(shape45.coordinates[0]).toBeCloseTo(-1060.66, 2)
    expect(shape45.coordinates[1]).toBeCloseTo(-353.553, 2)
  }

  const dsnString = convertCircuitJsonToDsnString(rotatedRectCircuitJson)
  const parsedDsn = parseDsnToDsnJson(dsnString) as DsnPcb
  const roundTripped = convertDsnPcbToCircuitJson(parsedDsn)

  const roundTrippedPads = roundTripped.filter(
    (el): el is PcbSmtPadRotatedRect =>
      el.type === "pcb_smtpad" && el.shape === "rotated_rect",
  )

  expect(roundTrippedPads).toHaveLength(2)
  expect(roundTrippedPads[0]).toMatchObject({
    shape: "rotated_rect",
    x: -1,
    y: -1,
    width: 2,
    height: 1,
    ccw_rotation: 45,
    layer: "top",
  })
  expect(roundTrippedPads[1]).toMatchObject({
    shape: "rotated_rect",
    x: 1,
    y: 1,
    width: 2,
    height: 1,
    ccw_rotation: 135,
    layer: "top",
  })
})
