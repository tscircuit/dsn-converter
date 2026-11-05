import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  parseDsnToDsnJson,
} from "lib"

test("exports polygonal pcb_board.outline to DSN structure boundary path and closes open ring", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
      outline: [
        { x: -10, y: -10 },
        { x: 10, y: -10 },
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: -10, y: 10 },
      ],
    },
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  expect(dsnJson.structure.boundary.path.coordinates).toEqual([
    -10000, -10000, 10000, -10000, 10000, 0, 0, 0, 0, 10000, -10000, 10000,
    -10000, -10000,
  ])

  const dsnString = convertCircuitJsonToDsnString(circuitJson)
  const reparsed = parseDsnToDsnJson(dsnString)
  if (!reparsed.is_dsn_pcb) {
    throw new Error("Expected parsed DSN PCB")
  }
  expect(reparsed.structure.boundary.path?.coordinates).toEqual([
    -10000, -10000, 10000, -10000, 10000, 0, 0, 0, 0, 10000, -10000, 10000,
    -10000, -10000,
  ])
})

test("does not duplicate closing vertex when pcb_board.outline is already closed", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
      outline: [
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: 0, y: 5 },
        { x: -5, y: -5 },
      ],
    },
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  expect(dsnJson.structure.boundary.path.coordinates).toEqual([
    -5000, -5000, 5000, -5000, 0, 5000, -5000, -5000,
  ])
})
