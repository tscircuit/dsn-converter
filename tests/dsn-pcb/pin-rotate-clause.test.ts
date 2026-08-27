import { expect, test } from "bun:test"
import type { PcbBoard, PcbPlatedHole } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

// The smoothieboard DSN uses the optional rotation clause in pin definitions:
//   (pin Oval[A]Pad_4267.2x2133.6_um (rotate 90) 4 5250 0)
// Previously the parser treated "rotate" as the pin number, the pin number as
// the X coordinate and the X coordinate as the Y coordinate, which pushed the
// X1-X5 power connectors off the board and collapsed their pin numbers.
test("pin (rotate <angle>) clause is parsed correctly", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb

  const image = dsnJson.library.images.find(
    (img) => img.name === "smoothieboard-5driver:180G-4",
  )
  expect(image).toBeDefined()

  const pins = image!.pins
  expect(pins.map((p) => p.pin_number)).toEqual([4, 3, 2, 1])
  expect(pins.map((p) => p.x)).toEqual([5250, 1750, -1750, -5250])
  expect(pins.map((p) => p.y)).toEqual([0, 0, 0, 0])
  expect(pins.map((p) => p.rotation)).toEqual([90, 90, 90, 90])
})

test("rotated pins produce correctly placed and oriented pads", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const board = circuitJson.find((el) => el.type === "pcb_board") as PcbBoard
  expect(board.width).toBeDefined()
  expect(board.height).toBeDefined()
  const minX = board.center.x - board.width! / 2
  const maxX = board.center.x + board.width! / 2
  const minY = board.center.y - board.height! / 2
  const maxY = board.center.y + board.height! / 2

  const connectorHoles = circuitJson.filter(
    (el): el is PcbPlatedHole =>
      el.type === "pcb_plated_hole" && el.pcb_plated_hole_id.includes("180G-4"),
  )
  // 5 connectors (X1-X5) x 4 pins
  expect(connectorHoles.length).toBe(20)

  for (const hole of connectorHoles) {
    // Pin numbers are 1-4, not the misparsed "rotate"
    expect(hole.pcb_plated_hole_id).not.toContain("rotate")
    // Every connector hole is inside the board boundary
    expect(hole.x).toBeGreaterThanOrEqual(minX)
    expect(hole.x).toBeLessThanOrEqual(maxX)
    expect(hole.y).toBeGreaterThanOrEqual(minY)
    expect(hole.y).toBeLessThanOrEqual(maxY)
    // The 4267.2x2133.6um oval padstack is rotated 90deg, so the
    // resulting plated hole is taller than it is wide
    if (hole.shape === "oval") {
      expect(hole.outer_height).toBeGreaterThan(hole.outer_width)
    }
  }
})
