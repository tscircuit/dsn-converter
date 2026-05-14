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

test("stringify dsn json quotes filenames with spaces", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const spacedFilenameJson: DsnPcb = {
    ...dsnJson,
    filename: "board export.dsn",
  }

  const dsnString = stringifyDsnJson(spacedFilenameJson)

  expect(dsnString.startsWith('(pcb "board export.dsn"')).toBe(true)
  expect(parseDsnToDsnJson(dsnString)).toMatchObject({
    filename: "board export.dsn",
  })
})
