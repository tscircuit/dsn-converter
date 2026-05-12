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

test("stringify dsn json preserves rect padstack shapes", () => {
  const dsnWithRectPadstack = `(pcb rect-padstack.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (path pcb 0  0 0  1000 0  1000 1000  0 1000)
    )
    (via "Via[0-1]_800:400_um")
    (rule
      (width 150)
      (clearance 150)
    )
  )
  (placement)
  (library
    (image "U1"
      (pin RectPad 1 0 0)
    )
    (padstack "RectPad"
      (shape (rect Top -500 -250 500 250))
      (attach off)
    )
  )
  (network
    (net "N1"
      (pins U1-1)
    )
    (class "kicad_default" "" "N1"
      (circuit
        (use_via "Via[0-1]_800:400_um")
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
  expect(dsnString).toContain("(shape (rect Top -500 -250 500 250))")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.library.padstacks[0].shapes).toEqual([
    {
      shapeType: "rect",
      layer: "Top",
      coordinates: [-500, -250, 500, 250],
    },
  ])
})
