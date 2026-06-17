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

test("preserves net property metadata when stringifying", () => {
  const dsn = `(pcb net-property.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0")
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
      (path F.Cu 0 0 0 1000 0)
    )
    (via "")
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network
    (net "GND"
      (pins U1-1)
      (property
        (index 42)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.network.nets[0].property).toEqual({ index: 42 })

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb
  expect(reparsedJson.network.nets[0].property).toEqual({ index: 42 })
})
