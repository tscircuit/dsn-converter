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

test("preserves structure plane polygons from Smoothieboard DSN", () => {
  const dsnJson = parseDsnToDsnJson(smoothieDsnFile) as DsnPcb

  expect(dsnJson.structure.planes).toHaveLength(1)
  expect(dsnJson.structure.planes?.[0]).toEqual({
    net: "AGND",
    polygon: {
      layer: "Route2",
      width: 0,
      coordinates: [
        214249, -158877, 82677, -159512, 82550, -50673, 214376, -50673, 214249,
        -158877,
      ],
    },
  })

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.structure.planes).toEqual(dsnJson.structure.planes)
})
