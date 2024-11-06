import { parseDsnToDsnJson, stringifyDsnJson, type DsnPcb } from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}
import { expect, test } from "bun:test"

test("stringify dsn json", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile)
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString)

  for (const key of Object.keys(reparsedJson) as Array<keyof DsnPcb>) {
    expect(reparsedJson[key]).toEqual(dsnJson[key])
  }

  // Test that we can parse the generated string back to the same structure
  // expect(reparsedJson).toEqual(dsnJson)
})
