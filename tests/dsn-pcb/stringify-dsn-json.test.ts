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

test("preserves non-path image outlines", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "outline-shapes.dsn"
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
      (path F.Cu 0  0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
    )
  )
  (placement)
  (library
    (image "U1"
      (outline (rect F.Cu -100 -50 100 50))
      (outline (circle F.Cu 200 10 20))
      (outline (polygon F.Cu 0 0 0 50 0 50 50))
    )
  )
  (network)
  (wiring)
)`) as DsnPcb

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.library.images[0].outlines).toEqual(
    dsnJson.library.images[0].outlines,
  )
})
