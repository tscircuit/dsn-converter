import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  type DsnPcb,
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

const rotatedRectCircuitJson: AnyCircuitElement[] = [
  {
    type: "source_component",
    source_component_id: "source_component_0",
    ftype: "simple_resistor",
    name: "R1",
    resistance: 1000,
    supplier_part_numbers: {},
  },
  {
    type: "source_port",
    source_port_id: "source_port_0",
    name: "pin1",
    pin_number: 1,
    port_hints: ["1", "left"],
    source_component_id: "source_component_0",
  },
  {
    type: "source_port",
    source_port_id: "source_port_1",
    name: "pin2",
    pin_number: 2,
    port_hints: ["2", "right"],
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
    width: 1.2612,
    height: 1.3612,
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
    x: -0.360624,
    y: -0.360624,
    source_port_id: "source_port_0",
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_1",
    pcb_component_id: "pcb_component_0",
    layers: ["top"],
    x: 0.360624,
    y: 0.360624,
    source_port_id: "source_port_1",
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_0",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_0",
    layer: "top",
    shape: "rotated_rect",
    width: 0.54,
    height: 0.64,
    x: -0.360624,
    y: -0.360624,
    ccw_rotation: 45,
    port_hints: ["1", "left"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_1",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_1",
    layer: "top",
    shape: "rotated_rect",
    width: 0.54,
    height: 0.64,
    x: 0.360624,
    y: 0.360624,
    ccw_rotation: 45,
    port_hints: ["2", "right"],
  },
]

test("rotated_rect smt pads export rotated polygon padstacks and round-trip back to rotated_rect", () => {
  const dsnJson = convertCircuitJsonToDsnJson(rotatedRectCircuitJson)
  const padstack = dsnJson.library.padstacks.find(
    (p) => p.name === "RoundRect[T]Pad_540x640_45deg_um",
  )

  expect(padstack).toBeDefined()
  expect(padstack?.shapes[0]?.shapeType).toBe("polygon")
  if (padstack?.shapes[0]?.shapeType === "polygon") {
    expect(padstack.shapes[0].coordinates).toEqual([
      -417.193, 35.355, -35.355, 417.193, 417.193, -35.355, 35.355, -417.193,
      -417.193, 35.355,
    ])
  }

  expect(dsnJson.placement.components[0]?.places[0]?.rotation).toBe(0)

  const dsnString = convertCircuitJsonToDsnString(rotatedRectCircuitJson)
  const parsedDsn = parseDsnToDsnJson(dsnString) as DsnPcb
  const roundTripped = convertDsnPcbToCircuitJson(parsedDsn)
  const smtPads = roundTripped.filter((e) => e.type === "pcb_smtpad")

  expect(smtPads).toHaveLength(2)
  for (const pad of smtPads) {
    expect(pad.shape).toBe("rotated_rect")
    if (pad.shape === "rotated_rect") {
      expect(pad.width).toBeCloseTo(0.54, 4)
      expect(pad.height).toBeCloseTo(0.64, 4)
      expect(pad.ccw_rotation).toBe(45)
    }
  }
})
