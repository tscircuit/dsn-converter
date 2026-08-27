import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
// @ts-ignore
import smoothieDsnFile from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
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

test("preserves image keepout circles through DSN stringify roundtrip", () => {
  const dsnJson = parseDsnToDsnJson(smoothieDsnFile) as DsnPcb
  const keepouts = dsnJson.library.images.flatMap(
    (image) => image.keepouts ?? [],
  )

  expect(keepouts.length).toBeGreaterThan(0)
  expect(keepouts[0].name).toBe("")
  expect(keepouts[0].shape).toMatchObject({
    shapeType: "circle",
    layer: "Top",
    diameter: 3600,
  })

  const offsetKeepout = keepouts.find(
    (keepout) =>
      keepout.shape.shapeType === "circle" &&
      keepout.shape.layer === "Top" &&
      keepout.shape.diameter === 1600 &&
      keepout.shape.x === 0 &&
      keepout.shape.y === -4500,
  )
  expect(offsetKeepout).toBeDefined()

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain('(keepout "" (circle Top 3600))')
  expect(dsnString).toContain('(keepout "" (circle Top 1600 0 -4500))')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const reparsedKeepouts = reparsedJson.library.images.flatMap(
    (image) => image.keepouts ?? [],
  )
  expect(reparsedKeepouts.length).toBe(keepouts.length)
  expect(
    reparsedKeepouts.some(
      (keepout) =>
        keepout.shape.shapeType === "circle" &&
        keepout.shape.layer === "Top" &&
        keepout.shape.diameter === 1600 &&
        keepout.shape.x === 0 &&
        keepout.shape.y === -4500,
    ),
  ).toBe(true)
})
