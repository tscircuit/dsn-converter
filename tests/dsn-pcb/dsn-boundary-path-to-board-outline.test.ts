import { expect, test } from "bun:test"
import type { PcbBoard } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

// Coordinates in the DSN are micrometers, the converter emits millimeters.
const createDsnWithBoundary = (boundaryPath: string) => `(pcb boundary-test.dsn
  (parser
    (string_quote ")
    (host_version "0.0.1")
    (space_in_quoted_tokens on)
    (host_cad "test")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary
      ${boundaryPath}
    )
    (via "Via[0-1]_600:300_um")
    (rule (width 200) (clearance 200))
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

const convertDsnToBoard = (dsnText: string): PcbBoard => {
  const dsnJson = parseDsnToDsnJson(dsnText) as DsnPcb
  const board = convertDsnPcbToCircuitJson(dsnJson).find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  if (!board) {
    throw new Error("convertDsnPcbToCircuitJson returned no pcb_board")
  }
  return board
}

const expectPointsToBeClose = (
  actual: Array<{ x: number; y: number }> | undefined,
  expected: Array<{ x: number; y: number }>,
) => {
  expect(actual).toBeDefined()
  expect(actual).toHaveLength(expected.length)
  expected.forEach((point, i) => {
    expect(actual?.[i]?.x).toBeCloseTo(point.x, 6)
    expect(actual?.[i]?.y).toBeCloseTo(point.y, 6)
  })
}

// L-shaped board with a 30 x 20 mm bounding box. Its outline is not a
// rectangle, so it cannot be recovered from the bounding box alone. Y is
// negative, as KiCad writes it.
const lShapeVertices = [
  { x: 10, y: -30 },
  { x: 40, y: -30 },
  { x: 40, y: -24 },
  { x: 28, y: -24 },
  { x: 28, y: -10 },
  { x: 10, y: -10 },
]

const lShapePathClosed = `(path pcb 0
        10000 -30000  40000 -30000  40000 -24000
        28000 -24000  28000 -10000  10000 -10000
        10000 -30000)`

const lShapePathOpen = `(path pcb 0
        10000 -30000  40000 -30000  40000 -24000
        28000 -24000  28000 -10000  10000 -10000)`

test("polygon boundary path becomes the board outline with its real vertices", () => {
  const board = convertDsnToBoard(createDsnWithBoundary(lShapePathClosed))

  // The closing point of the path is not duplicated and the notch survives,
  // which a 4 corner bounding rectangle could never represent.
  expectPointsToBeClose(board.outline, lShapeVertices)
  expect(board.shape).toBe("polygon")

  // width, height and center still describe the bounding box
  expect(board.width).toBeCloseTo(30, 6)
  expect(board.height).toBeCloseTo(20, 6)
  expect(board.center.x).toBeCloseTo(25, 6)
  expect(board.center.y).toBeCloseTo(-20, 6)
})

test("polygon boundary path without a repeated closing point keeps every vertex", () => {
  const board = convertDsnToBoard(createDsnWithBoundary(lShapePathOpen))

  expectPointsToBeClose(board.outline, lShapeVertices)
  expect(board.shape).toBe("polygon")
})

test("rectangular boundary path keeps the bounding box and gets no outline", () => {
  const board = convertDsnToBoard(
    createDsnWithBoundary(
      "(path pcb 0 10000 -30000 40000 -30000 40000 -10000 10000 -10000 10000 -30000)",
    ),
  )

  expect(board.outline).toBeUndefined()
  expect(board.shape).not.toBe("polygon")
  expect(board.width).toBeCloseTo(30, 6)
  expect(board.height).toBeCloseTo(20, 6)
  expect(board.center.x).toBeCloseTo(25, 6)
  expect(board.center.y).toBeCloseTo(-20, 6)
})

test("smoothieboard boundary converts to its real 38 vertex outline", () => {
  const board = convertDsnToBoard(smoothieboardDsn)

  expect(board.outline).toBeDefined()
  expect(board.outline).toHaveLength(38)
  expect(board.shape).toBe("polygon")

  const outline = board.outline ?? []
  const distinctVertices = new Set(outline.map(({ x, y }) => `${x},${y}`))
  expect(distinctVertices.size).toBe(38)

  // The outline is in the same space as width, height and center
  const xs = outline.map(({ x }) => x)
  const ys = outline.map(({ y }) => y)
  expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(
    board.width as number,
    6,
  )
  expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(
    board.height as number,
    6,
  )
  expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(board.center.x, 6)
  expect((Math.max(...ys) + Math.min(...ys)) / 2).toBeCloseTo(board.center.y, 6)
})
