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
    try {
      expect(reparsedJson[key]).toEqual(dsnJson[key] as any)
    } catch (e) {
      console.log(`Key: ${key}`)
      console.log("Original:", JSON.stringify(dsnJson[key], null, 2))
      console.log("Reparsed:", JSON.stringify(reparsedJson[key], null, 2))
      throw e
    }
  }

  // Test that we can parse the generated string back to the same structure
  // expect(reparsedJson).toEqual(dsnJson)
})
