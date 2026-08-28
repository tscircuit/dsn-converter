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

test("stringify dsn json preserves pcb parser options", () => {
  const dsn = `(pcb parser-options
  (parser
    (string_quote \`)
    (space_in_quoted_tokens off)
    (host_cad "Other CAD")
    (host_version "1.2.3")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (path F.Cu 0 0 0 100 100)
    )
    (via Via_600)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.parser).toEqual(dsnJson.parser)
})
