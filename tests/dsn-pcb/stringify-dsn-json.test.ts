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

test("stringify dsn json with a layer missing property index", () => {
  const input = `(pcb "missing-layer-property.dsn"
    (parser
      (string_quote ")
      (space_in_quoted_tokens on)
      (host_cad "KiCad's Pcbnew")
      (host_version "9.0")
    )
    (resolution um 10)
    (unit um)
    (structure
      (layer F.Cu
        (type signal)
      )
      (boundary
        (path F.Cu 0 0 0 1000 0 1000 1000 0 1000 0 0)
      )
      (via "Via[0-1]_600:300_um")
      (rule
        (width 150)
      )
    )
    (placement)
    (library)
    (network)
    (wiring)
  )`

  const dsnJson = parseDsnToDsnJson(input) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).not.toContain("(index undefined)")
  expect(reparsedJson.structure.layers[0].property).toBeUndefined()
})
