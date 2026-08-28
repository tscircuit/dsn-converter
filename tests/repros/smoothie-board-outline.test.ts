import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Regression guard for #54: the DSN structure boundary polygon must be preserved
 * on pcb_board.outline.
 *
 * The Smoothie Board's boundary is a 39-point rounded-rectangle polygon, but the
 * converter only derives center/width/height from its bounding box and never
 * populates the (schema-supported) `pcb_board.outline`, so the real board
 * silhouette is lost.
 */
test("pcb_board preserves the DSN boundary outline polygon", () => {
  const circuitJson = convertDsnPcbToCircuitJson(
    parseDsnToDsnJson(smoothieDsn) as DsnPcb,
  ) as Array<Record<string, any>>

  const board = circuitJson.find((e) => e.type === "pcb_board") as
    | Record<string, any>
    | undefined

  expect(board).toBeDefined()
  expect(Array.isArray(board!.outline)).toBe(true)
  // A non-rectangular boundary => more than 4 points (39 in this fixture).
  expect(board!.outline.length).toBeGreaterThan(4)
})
