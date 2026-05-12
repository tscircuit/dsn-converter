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

test("stringify dsn json preserves rectangular padstack shapes", () => {
  const dsnWithRectPadstack = `(pcb rect-padstack-test
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "test")
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
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 150)
    )
  )
  (placement)
  (library
    (padstack RectPad
      (shape (rect F.Cu -500 -250 500 250))
      (attach off)
    )
  )
  (network
    (class kicad_default ""
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 150)
        (clearance 150)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnWithRectPadstack) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain("(shape (rect F.Cu -500 -250 500 250))")
  expect(reparsedJson.library.padstacks[0].shapes[0]).toEqual(
    dsnJson.library.padstacks[0].shapes[0],
  )
})
