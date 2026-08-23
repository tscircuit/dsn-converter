import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Part of https://github.com/tscircuit/dsn-converter/issues/54
 *
 * stringifyDsnJson only handled polygon/circle/path padstack shapes, so any
 * padstack using a `(shape (rect ...))` (a common KiCad export for
 * rectangular THT/SMD pads, e.g. the pin-1 marker pad) silently lost its
 * shape entirely on parse -> stringify -> reparse. The Smoothie Board DSN
 * file has 28 such padstacks.
 */
test("padstack rect shapes survive a parse -> stringify -> reparse round trip", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const rectPadstacks = dsnJson.library.padstacks.filter((p) =>
    p.shapes.some((s) => s.shapeType === "rect"),
  )
  // Sanity check the fixture actually exercises this case
  expect(rectPadstacks.length).toBeGreaterThan(0)

  const reparsed = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  for (const original of rectPadstacks) {
    const roundtripped = reparsed.library.padstacks.find(
      (p) => p.name === original.name,
    )
    expect(roundtripped).toBeDefined()
    expect(roundtripped!.shapes).toEqual(original.shapes)
  }
})
