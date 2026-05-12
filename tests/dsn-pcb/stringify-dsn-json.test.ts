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

test("stringify dsn json emits standard wiring via records", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  dsnJson.wiring.wires.push({
    type: "via",
    net: "N1",
    path: {
      layer: "all",
      width: 0,
      coordinates: [123, 456],
    },
  })

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain('(via "Via[0-1]_600:300_um" 123 456 (net "N1"))')
  expect(dsnString).not.toContain("(via       (path")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const via = reparsedJson.wiring.wires.find(
    (wire) => wire.type === "via" && wire.net === "N1",
  )

  expect(via?.path.coordinates).toEqual([123, 456])
})
