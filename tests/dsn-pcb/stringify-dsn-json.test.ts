import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
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

test("stringify dsn json preserves polyline_path wires", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  dsnJson.wiring.wires.push({
    type: "route",
    net: "N2",
    polyline_path: {
      layer: "F.Cu",
      width: 200,
      coordinates: [0, 0, 100, 0, 100, 0, 100, 100],
    },
    path: {
      layer: "F.Cu",
      width: 200,
      coordinates: [],
    },
  })

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain(
    "(polyline_path F.Cu 200  0 0 100 0 100 0 100 100)",
  )

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const polylineWire = reparsedJson.wiring.wires.find(
    (wire) => wire.net === "N2" && wire.polyline_path,
  )

  expect(polylineWire?.polyline_path?.coordinates).toEqual([
    0, 0, 100, 0, 100, 0, 100, 100,
  ])
})
