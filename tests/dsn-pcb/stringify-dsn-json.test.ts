import { expect, test } from "bun:test"
import {
  convertDsnPcbToCircuitJson,
  type DsnPcb,
  parseDsnToDsnJson,
  stringifyDsnJson,
} from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
// @ts-ignore
import smoothieBoundaryShapesDsn from "../assets/repro/smoothieboard-boundary-shapes.dsn" with {
  type: "text",
}

const getBoard = (dsnJson: DsnPcb) => {
  const board = convertDsnPcbToCircuitJson(dsnJson).find(
    (element) => element.type === "pcb_board",
  )
  if (!board || board.type !== "pcb_board") {
    throw new Error("Expected a pcb_board element")
  }
  return board
}

test("stringify dsn json", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  for (const key of Object.keys(reparsedJson) as Array<keyof DsnPcb>) {
    expect(reparsedJson[key]).toEqual(dsnJson[key] as any)
  }

  // Test that we can parse the generated string back to the same structure
  // expect(reparsedJson).toEqual(dsnJson)
})

test("preserves non-path structure boundary shapes when stringifying", () => {
  const dsn = `(pcb boundary-shapes
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "unit-test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (rect pcb -10 -20 30 40)
    )
    (via "")
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.structure.boundary.rect).toEqual({
    type: "pcb",
    coordinates: [-10, -20, 30, 40],
  })

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain("(rect pcb -10 -20 30 40)")
  expect(reparsedJson.structure.boundary).toEqual(dsnJson.structure.boundary)

  const board = getBoard(reparsedJson)
  expect(board.width).toBeCloseTo(0.04)
  expect(board.height).toBeCloseTo(0.06)
})

test("preserves polygon structure boundary shapes when stringifying", () => {
  const dsn = `(pcb polygon-boundary
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "unit-test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (polygon pcb 0 -10 -20 30 -20 30 40 -10 40)
    )
    (via "")
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.structure.boundary.polygon).toEqual({
    type: "pcb",
    width: 0,
    coordinates: [-10, -20, 30, -20, 30, 40, -10, 40],
  })

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain("(polygon pcb 0 -10 -20 30 -20 30 40 -10 40)")
  expect(reparsedJson.structure.boundary).toEqual(dsnJson.structure.boundary)

  const board = getBoard(reparsedJson)
  expect(board.width).toBeCloseTo(0.04)
  expect(board.height).toBeCloseTo(0.06)
})

test("round-trips Smoothieboard rect and polygon boundary shapes from fixture", () => {
  const dsnJson = parseDsnToDsnJson(smoothieBoundaryShapesDsn) as DsnPcb

  expect(dsnJson.structure.boundary).toEqual({
    rect: {
      type: "pcb",
      coordinates: [82550, -159512, 214376, -50673],
    },
    polygon: {
      type: "pcb",
      width: 0,
      coordinates: [
        82550, -159512, 214376, -159512, 214376, -50673, 82550, -50673,
      ],
    },
  })

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.structure.boundary).toEqual(dsnJson.structure.boundary)
})
