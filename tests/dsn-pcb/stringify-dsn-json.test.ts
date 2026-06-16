import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
// @ts-ignore
import smoothieboardDsnFile from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const countRectPadstackShapes = (dsnJson: DsnPcb) =>
  dsnJson.library.padstacks.reduce(
    (count, padstack) =>
      count +
      padstack.shapes.filter((shape) => shape.shapeType === "rect").length,
    0,
  )

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

test("stringify dsn json preserves rectangular padstack shapes", () => {
  const dsnJson = parseDsnToDsnJson(`
    (pcb "rect-padstack.dsn"
      (parser
        (string_quote ")
        (space_in_quoted_tokens on)
        (host_cad "KiCad")
        (host_version "8.0")
      )
      (resolution um 10)
      (unit um)
      (structure
        (layer Top (type signal) (property (index 0)))
        (boundary (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0))
        (via "Via[0-1]_600:300_um")
        (rule (width 150) (clearance 150))
      )
      (placement)
      (library
        (image "R_0603" (pin Rect[T]Pad_1000x500_um 1 0 0))
        (padstack Rect[T]Pad_1000x500_um
          (shape (rect Top -500 -250 500 250))
          (attach off)
        )
      )
      (network)
      (wiring)
    )
  `) as DsnPcb

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.library.padstacks[0]!.shapes).toContainEqual({
    shapeType: "rect",
    layer: "Top",
    coordinates: [-500, -250, 500, 250],
  })
})

test("stringify dsn json keeps Smoothieboard rectangular padstack count", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsnFile) as DsnPcb
  const originalRectShapeCount = countRectPadstackShapes(dsnJson)

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(originalRectShapeCount).toBeGreaterThan(0)
  expect(countRectPadstackShapes(reparsedJson)).toBe(originalRectShapeCount)
})
