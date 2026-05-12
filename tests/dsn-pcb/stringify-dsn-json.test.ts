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

test("preserves network class use_layer constraints", () => {
  const dsnWithUseLayer = testDsnFile.replace(
    "(use_via Via[0-1]_600:300_um)",
    "(use_layer F.Cu B.Cu)\n        (use_via Via[0-1]_600:300_um)",
  )
  const dsnJson = parseDsnToDsnJson(dsnWithUseLayer) as DsnPcb

  expect(dsnJson.network.classes.map((cls) => cls.circuit.use_layer)).toEqual([
    ["F.Cu", "B.Cu"],
  ])

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain("(use_layer F.Cu B.Cu)")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(
    reparsedJson.network.classes.map((cls) => cls.circuit.use_layer),
  ).toEqual([["F.Cu", "B.Cu"]])
})
