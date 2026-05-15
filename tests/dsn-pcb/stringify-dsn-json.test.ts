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

test("stringify dsn json preserves wiring via type metadata", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const viaTypeJson: DsnPcb = {
    ...dsnJson,
    wiring: {
      wires: [
        {
          type: "via",
          via_type: "protect",
          net: "AGND",
          path: {
            layer: "all",
            width: 0,
            coordinates: [174879, -77089],
          },
        },
      ],
    },
  }

  const dsnString = stringifyDsnJson(viaTypeJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain("(type protect)")
  expect(reparsedJson.wiring.wires[0]).toMatchObject({
    type: "via",
    via_type: "protect",
  })
})
